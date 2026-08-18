import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import dns from 'dns';

dotenv.config();

const app = express();
const PORT = 3000;

// Set up server-side body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize GenAI on the server with recommended User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Helper function to retry Gemini API calls in case of transient 503 errors
async function generateWithRetry<T>(aiCall: () => Promise<T>, maxRetries = 2, delayMs = 1500): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await aiCall();
    } catch (error: any) {
      attempt++;
      const isTransient = error?.status === 503 || error?.statusCode === 503 || error?.message?.includes('503') || error?.message?.includes('UNAVAILABLE') || error?.message?.includes('Service Unavailable');
      if (isTransient && attempt <= maxRetries) {
        console.warn(`[Gemini API] 503 UNAVAILABLE on attempt ${attempt}. Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2; // exponential backoff
      } else {
        throw error;
      }
    }
  }
}

// API endpoint to parse copy-pasted or extracted text with Gemini
app.post('/api/parse-policy', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Policy text is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server. Please add it in Settings > Secrets.' });
    }

    console.log('[Server API] Parsing policy text with gemini-3.5-flash...');

    const prompt = `Analyze the following policy text/document. Extract and categorize all standard policy structure and compliance elements. If any section is not present in the text, summarize or draft an appropriate compliant response based on the overall tone and topic of the policy.

Format your output as a single JSON object matching the requested schema.

Policy text to parse:
"""
${text}
"""`;

    const response = await generateWithRetry(() => ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an expert regulatory compliance, audit, and security compliance consultant. Your task is to extract, structure, and refine healthcare and non-healthcare policy documents into a clean, professional, and compliant structure.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            policy_no: { type: Type.STRING, description: 'The official identifier or code (e.g., IT-POL-01, SH-POL-24) or a drafted code if not found' },
            policy_name: { type: Type.STRING, description: 'The formal title/name of the policy' },
            version: { type: Type.STRING, description: 'The document version (e.g., 1.0, 1.1) or default to 1.0' },
            category: { type: Type.STRING, description: 'The high-level category like Information Security, Operations, Human Resources, Administration' },
            department: { type: Type.STRING, description: 'The department owning this policy, like IT, HR, Medical Office, QA' },
            classification: { type: Type.STRING, description: 'Document classification level. Must be exactly "Confidential", "Restricted", or "Secret"' },
            objective: { type: Type.STRING, description: 'Extracted Objective or Purpose of this regulation' },
            scope: { type: Type.STRING, description: 'Extracted Scope or Applicability clause' },
            resp_it_manager: { type: Type.STRING, description: 'Extracted or proposed roles/responsibilities of the IT Manager / Department Head' },
            resp_md: { type: Type.STRING, description: 'Extracted or proposed roles/responsibilities of the Managing Director / Top Management' },
            resp_all_users: { type: Type.STRING, description: 'Extracted or proposed roles/responsibilities of All Users / Employees' },
            policy_statement: { type: Type.STRING, description: 'The core Policy Statement detailing compliance requirements and mandates' },
            core_principles: { type: Type.STRING, description: 'Detailed list of core principles, standards, or guidelines' },
            compliance_disciplinary: { type: Type.STRING, description: 'Details about compliance enforcement, policy violations, or disciplinary actions' },
            compliance_clarifications: { type: Type.STRING, description: 'Guidance on who to contact for questions/clarifications' },
            compliance_checks: { type: Type.STRING, description: 'Requirements for regular compliance audits, reviews, or checks' },
            compliance_exceptions: { type: Type.STRING, description: 'Approved exceptions and criteria for exceptions' },
          },
          required: [
            'policy_no',
            'policy_name',
            'objective',
            'scope',
            'policy_statement'
          ]
        }
      }
    }));

    const parsedJsonText = response.text?.trim() || '{}';
    const parsedData = JSON.parse(parsedJsonText);

    return res.json(parsedData);
  } catch (error: any) {
    console.error('[Server API] Parse policy error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to parse policy text with Gemini.' });
  }
});

// Smartpro AI Assistant endpoint
app.post('/api/ask-ai', async (req, res) => {
  try {
    const { prompt, systemInstruction } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server. Please add it in Settings > Secrets.' });
    }

    console.log('[Server API] Smartpro AI Assistant query:', prompt.substring(0, 100));

    const response = await generateWithRetry(() => ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || 'You are Smartpro AI Assistant, an expert advisor for Healthcare Compliance, ADHICS, Information Security, UAE Legal Regulations, and Service Agreements/Contracts. Provide clear, professional, well-structured, and precise answers.'
      }
    }));

    const text = response.text || 'No response generated.';
    return res.json({ text });
  } catch (error: any) {
    console.error('[Server API] Ask AI error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to generate AI response.' });
  }
});

// Smart SMTP Host Resolver with MX auto-discovery for UAE and custom enterprise domains
async function resolveSmtpHost(rawHost: string): Promise<{ resolvedHost: string; isAutoResolved: boolean; originalHost: string }> {
  const host = (rawHost || '').trim();
  if (!host) {
    return { resolvedHost: 'najma.tasjeel.ae', isAutoResolved: false, originalHost: host };
  }

  // Known direct overrides for UAE SmartPro domain on Tasjeel
  if (host === 'mail.smartpro.ae' || host === 'smtp.smartpro.ae' || host === 'smartpro.ae') {
    return { resolvedHost: 'najma.tasjeel.ae', isAutoResolved: true, originalHost: host };
  }

  try {
    await dns.promises.lookup(host);
    return { resolvedHost: host, isAutoResolved: false, originalHost: host };
  } catch (err: any) {
    console.log(`[SMTP DNS] Direct lookup for host '${host}' failed (${err.code}). Attempting MX resolution...`);
    try {
      const parts = host.split('.');
      const domain = parts.length > 2 ? parts.slice(-2).join('.') : host;
      const mxRecords = await dns.promises.resolveMx(domain);
      if (mxRecords && mxRecords.length > 0) {
        mxRecords.sort((a, b) => a.priority - b.priority);
        const bestMx = mxRecords[0].exchange;
        console.log(`[SMTP DNS] Discovered MX host for '${domain}': ${bestMx}`);
        return { resolvedHost: bestMx, isAutoResolved: true, originalHost: host };
      }
    } catch (mxErr: any) {
      console.log(`[SMTP DNS] MX lookup also failed for '${host}':`, mxErr.message);
    }
    
    // Fallback for smartpro domains
    if (host.includes('smartpro.ae')) {
      return { resolvedHost: 'najma.tasjeel.ae', isAutoResolved: true, originalHost: host };
    }
    
    return { resolvedHost: host, isAutoResolved: false, originalHost: host };
  }
}

// Helper to normalize diverse SMTP configuration payloads from various frontend components
function normalizeSmtpConfig(rawConfig: any) {
  const config = rawConfig || {};
  const server = config.server || config.host || config.smtp_server || config.smtp_host || config.smtpServer || 'najma.tasjeel.ae';
  const port = Number(config.port || config.smtp_port || config.smtpPort || 587);
  const username = config.username || config.user || config.auth_user || config.login || config.email || '';
  const password = config.password || config.pass || config.auth_pass || config.authPassword || '';
  const sender_email = config.sender_email || config.sender || config.from || config.from_email || config.senderEmail || username || 'mail@smartpro.ae';
  
  const isSslExplicit = config.ssl === true || config.secure === true || config.is_ssl === true;
  const isTlsExplicit = config.tls === true || config.requireTLS === true || config.starttls === true || config.is_tls === true;
  
  // Port 465 is implicit SSL; 587 and 25 use STARTTLS
  const isSecure = port === 465 || (isSslExplicit && port !== 587 && port !== 25);
  const requireTLS = port === 587 || isTlsExplicit;
  const sandbox_mode = Boolean(config.sandbox_mode ?? config.sandbox ?? config.is_sandbox ?? false);

  return {
    server,
    port,
    username,
    password,
    sender_email,
    ssl: isSecure,
    tls: requireTLS,
    sandbox_mode,
    provider: config.provider || 'Custom'
  };
}

// Helper to normalize diverse recipient formats (array, single string, comma/semicolon delimited)
function normalizeRecipients(rawRecipients: any): string[] {
  if (!rawRecipients) return [];
  if (Array.isArray(rawRecipients)) {
    return rawRecipients
      .flatMap(r => typeof r === 'string' ? r.split(/[,;]/) : [])
      .map(r => r.trim())
      .filter(r => r && r.includes('@'));
  }
  if (typeof rawRecipients === 'string') {
    return rawRecipients
      .split(/[,;]/)
      .map(r => r.trim())
      .filter(r => r && r.includes('@'));
  }
  return [];
}

// SMTP Connection Verification endpoint using actual credentials
app.post('/api/test-smtp', async (req, res) => {
  try {
    const smtpConfig = normalizeSmtpConfig(req.body);
    const { server: rawServer, port, username, password, ssl, tls, sandbox_mode } = smtpConfig;
    
    if (!rawServer || !port) {
      return res.status(400).json({ error: 'Server and Port are required' });
    }

    // Resolve actual mail server host (e.g. mail.smartpro.ae -> najma.tasjeel.ae)
    const { resolvedHost, isAutoResolved, originalHost } = await resolveSmtpHost(rawServer);

    if (sandbox_mode) {
      console.log(`[SMTP API] Sandbox mode explicitly active. Simulating connection for ${resolvedHost}:${port}...`);
      return res.json({
        success: true,
        simulated: true,
        message: `[Sandbox Relay Gate] Connection & authentication simulated successfully for ${originalHost} (${resolvedHost}:${port}).`
      });
    }

    console.log(`[SMTP API] Testing connection to ${resolvedHost}:${port} (Original: ${originalHost})...`);

    const transporter = nodemailer.createTransport({
      host: resolvedHost,
      port: port,
      secure: ssl,
      auth: (username && password) ? {
        user: username,
        pass: password,
      } : undefined,
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      },
      requireTLS: tls,
      connectionTimeout: 12000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    // Verify connection and authentication configuration
    await transporter.verify();
    
    const hostNote = isAutoResolved ? ` (via MX relay: ${resolvedHost})` : '';
    console.log(`[SMTP API] SMTP connection verified successfully for ${originalHost}${hostNote}`);
    return res.json({ 
      success: true, 
      message: `Successfully verified connection & authentication to ${originalHost}:${port}${hostNote}` 
    });
  } catch (error: any) {
    const errMsg = error?.message || 'SMTP Handshake or Authentication failed';
    console.log(`[SMTP API] Connection verification check result: ${errMsg}`);
    
    const isAuthError = errMsg.includes('535') || errMsg.includes('Invalid login') || errMsg.includes('authentication failed') || errMsg.includes('Username and Password not accepted');
    if (isAuthError) {
      return res.status(200).json({
        success: false,
        error: `SMTP Authentication Failed: The mail server connected, but rejected credentials for '${req.body?.username}'. Please verify password.`
      });
    }

    const isDnsOrNetworkError = 
      errMsg.includes('EAI_AGAIN') || 
      errMsg.includes('ENOTFOUND') || 
      errMsg.includes('getaddrinfo') || 
      errMsg.includes('ETIMEDOUT') || 
      errMsg.includes('ECONNREFUSED') ||
      errMsg.includes('EHOSTUNREACH');
    
    if (isDnsOrNetworkError && req.body?.sandbox_mode) {
      console.log(`[SMTP API] Host unreachable and sandbox requested. Falling back to Sandbox Mode.`);
      return res.json({
        success: true,
        simulated: true,
        autoFallback: true,
        message: `[Sandbox Relay Gate] Connection to '${req.body?.server || 'relay'}:${req.body?.port || 587}' simulated in Sandbox Mode.`
      });
    }

    return res.status(200).json({
      success: false,
      error: `Could not connect to SMTP host (${req.body?.server}:${req.body?.port}): ${errMsg}. Verify settings or enable Sandbox Relay mode.`
    });
  }
});

// Send Test Email using actual SMTP credentials
app.post('/api/send-test-email', async (req, res) => {
  try {
    const smtpConfig = normalizeSmtpConfig(req.body.smtpConfig || req.body);
    const recipientList = normalizeRecipients(req.body.recipientEmail || req.body.recipientEmails || req.body.recipients || req.body.to);
    const recipientEmail = recipientList[0] || req.body.recipientEmail;
    const { subject, body } = req.body;
    
    if (!recipientEmail) {
      return res.status(400).json({ error: 'recipientEmail is required' });
    }

    const { server: rawServer, port, username, password, ssl, tls, sender_email, sandbox_mode } = smtpConfig;

    // Resolve actual mail server host (e.g. mail.smartpro.ae -> najma.tasjeel.ae)
    const { resolvedHost, isAutoResolved, originalHost } = await resolveSmtpHost(rawServer);

    if (sandbox_mode) {
      console.log(`[SMTP API] Sandbox mode active. Simulating test email to ${recipientEmail} (Host: ${resolvedHost})`);
      return res.json({
        success: true,
        simulated: true,
        messageId: 'simulated-test-' + Date.now(),
        message: `[Sandbox Relay Gate] Test compliance email captured and simulated for ${recipientEmail}.`
      });
    }

    console.log(`[SMTP API] Dispatching real test email to ${recipientEmail} via ${resolvedHost}:${port} (Original: ${originalHost})...`);

    const transporter = nodemailer.createTransport({
      host: resolvedHost,
      port: port,
      secure: ssl,
      auth: (username && password) ? {
        user: username,
        pass: password,
      } : undefined,
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      },
      requireTLS: tls,
      connectionTimeout: 12000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    const info = await transporter.sendMail({
      from: sender_email || username || 'mail@smartpro.ae',
      to: recipientEmail,
      subject: subject || 'Outbound SMTP Compliance Test Notification',
      text: body || 'This is a test notification confirming your outbound SMTP compliance gateway is active and successfully delivering messages.',
      html: body ? undefined : `
        <div style="font-family: sans-serif; padding: 25px; color: #1e293b; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: inline-block; background-color: #f5f3ff; color: #4f46e5; border-radius: 50%; padding: 12px; font-weight: bold; font-size: 20px;">✓</div>
            <h2 style="color: #4f46e5; margin-top: 10px; font-size: 20px; font-weight: 800; letter-spacing: -0.025em;">SMTP Gateway Active</h2>
          </div>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;">Hello,</p>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;">This is a high-fidelity outbound diagnostic transmission confirming that your custom enterprise SMTP relay config on <strong>${originalHost}</strong> is active and delivering emails perfectly.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; padding: 15px; margin: 20px 0;">
            <span style="font-size: 10px; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 10px;">Connection Diagnostics</span>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155;">
              <tr>
                <td style="padding: 4px 0; font-weight: 600; width: 140px; color: #64748b;">SMTP Host:</td>
                <td style="padding: 4px 0; font-family: monospace; color: #0f172a;">${originalHost}:${port}${isAutoResolved ? ` (${resolvedHost})` : ''}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-weight: 600; color: #64748b;">Sender Identity:</td>
                <td style="padding: 4px 0; font-family: monospace; color: #0f172a;">${sender_email}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-weight: 600; color: #64748b;">Encryption Layer:</td>
                <td style="padding: 4px 0; color: #0f172a;">${ssl ? 'Implicit SSL' : tls ? 'STARTTLS Secure Link' : 'None / Plain Text'}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-weight: 600; color: #64748b;">Timestamp (UTC):</td>
                <td style="padding: 4px 0; color: #0f172a;">${new Date().toUTCString()}</td>
              </tr>
            </table>
          </div>
          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
          <p style="font-size: 11px; color: #94a3b8; line-height: 1.4; margin-bottom: 0; text-align: center;">This transmission was initiated from the Policy & Compliance Management Suite. You are receiving this because a diagnostic outbound request was dispatched to this address.</p>
        </div>
      `
    });

    console.log('[SMTP API] Real test email dispatched successfully. MessageID:', info.messageId);
    return res.json({ 
      success: true, 
      messageId: info.messageId, 
      message: `Email successfully delivered to ${recipientEmail} via ${resolvedHost}` 
    });
  } catch (error: any) {
    const errMsg = error?.message || 'SMTP Connection or Authentication error';
    console.log(`[SMTP API] Test email dispatch error: ${errMsg}`);
    
    return res.status(200).json({
      success: false,
      error: `SMTP Delivery Notice (${errMsg}). Check host, port, and authentication credentials in Settings -> SMTP Configuration, or toggle Sandbox Simulation Mode to capture test emails locally.`
    });
  }
});

// Send Rich Compliance Email using actual SMTP credentials
app.post('/api/send-compliance-email', async (req, res) => {
  try {
    const smtpConfig = normalizeSmtpConfig(req.body.smtpConfig || req.body);
    const recipientEmails = normalizeRecipients(req.body.recipientEmails || req.body.recipientEmail || req.body.recipients || req.body.to);
    const ccEmails = normalizeRecipients(req.body.cc || req.body.emailCc || req.body.ccEmails);
    const bccEmails = normalizeRecipients(req.body.bcc || req.body.emailBcc || req.body.bccEmails);
    
    const { subject, message, htmlContent, pdfAttachment, attachments: rawAttachments } = req.body;
    
    if (recipientEmails.length === 0) {
      return res.status(400).json({ error: 'At least one valid recipient email is required' });
    }

    const { server: rawServer, port, username, password, ssl, tls, sender_email, sandbox_mode } = smtpConfig;

    // Resolve actual mail server host (e.g. mail.smartpro.ae -> najma.tasjeel.ae)
    const { resolvedHost, isAutoResolved, originalHost } = await resolveSmtpHost(rawServer);

    if (sandbox_mode) {
      console.log(`[Sandbox Relay Gate] Compliance report email simulated successfully for ${recipientEmails.join(', ')} (Host: ${resolvedHost}).`);
      return res.json({
        success: true,
        simulated: true,
        messageId: 'simulated-compliance-' + Date.now(),
        message: `[Sandbox Relay Gate] Compliance report email simulated successfully for ${recipientEmails.join(', ')}.`
      });
    }

    console.log(`[SMTP API] Dispatching real Compliance Report to ${recipientEmails.join(', ')} via ${resolvedHost}:${port}...`);

    const transporter = nodemailer.createTransport({
      host: resolvedHost,
      port: port,
      secure: ssl,
      auth: (username && password) ? {
        user: username,
        pass: password,
      } : undefined,
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      },
      requireTLS: tls,
      connectionTimeout: 12000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    const attachments: any[] = [];
    if (pdfAttachment) {
      const sanitizedSubject = (subject || 'Compliance_Report').replace(/[^a-zA-Z0-9]/g, '_');
      attachments.push({
        filename: `${sanitizedSubject}.pdf`,
        content: pdfAttachment,
        encoding: 'base64',
        contentType: 'application/pdf'
      });
    }

    if (Array.isArray(rawAttachments)) {
      for (const att of rawAttachments) {
        if (att && att.content && att.filename) {
          attachments.push({
            filename: att.filename,
            content: att.content,
            encoding: att.encoding || 'base64',
            contentType: att.contentType || 'application/octet-stream'
          });
        }
      }
    }

    const mailOptions: any = {
      from: sender_email || username || 'mail@smartpro.ae',
      to: recipientEmails.join(', '),
      subject: subject || 'AL NASR PHARMACY Compliance Register',
      text: message || 'Please find the latest Regulatory Compliance Risk Register.',
      html: htmlContent || undefined,
      attachments: attachments.length > 0 ? attachments : undefined
    };

    if (ccEmails.length > 0) mailOptions.cc = ccEmails.join(', ');
    if (bccEmails.length > 0) mailOptions.bcc = bccEmails.join(', ');

    const info = await transporter.sendMail(mailOptions);

    console.log('[SMTP API] Real compliance report email dispatched. MessageID:', info.messageId);
    return res.json({ 
      success: true, 
      messageId: info.messageId, 
      message: `Email successfully delivered to ${recipientEmails.join(', ')} via ${resolvedHost}` 
    });
  } catch (error: any) {
    const errMsg = error?.message || 'SMTP Connection or Authentication error';
    console.log(`[SMTP API] Compliance report dispatch error: ${errMsg}`);

    return res.status(200).json({
      success: false,
      error: `SMTP Delivery Failed (${errMsg}). Check host, port, and credentials in Settings -> SMTP Configuration, or toggle Sandbox Simulation Mode to capture test emails locally.`
    });
  }
});

// AI Endpoint for Windows Endpoint Posture & Hardening Analysis
app.post('/api/analyze-windows-posture', async (req, res) => {
  try {
    const { endpointData } = req.body;

    if (!endpointData) {
      return res.status(400).json({ error: 'Endpoint data is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    console.log('[Server API] Analyzing Windows Endpoint Posture with Gemini...');

    const prompt = `Perform a comprehensive Windows Endpoint Hardening & Posture Audit based on the provided device scan telemetry.
Evaluate against DOH Abu Dhabi Healthcare Cyber Security (ADHICS), CIS Windows Benchmarks, and ISO 27001 Annex A controls.

Endpoint Telemetry & Security Configuration:
"""
${JSON.stringify(endpointData, null, 2)}
"""

Provide your evaluation as a structured JSON object. Format as valid JSON matching this structure:
{
  "overall_grade": "A|B|C|D|F",
  "posture_score": 85,
  "executive_summary": "High-level summary of security posture, key compliance voids, and risk rating.",
  "adhics_compliance_status": "Compliant | Partial Compliance | Non-Compliant",
  "critical_gaps": [
    {
      "finding_title": "Title of vulnerability or misconfiguration",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "impact": "Detailed operational & regulatory risk impact",
      "adhics_control_ref": "ADHICS Ref e.g. ADHICS.END.04 or CIS 2.3.1",
      "recommended_action": "Remediation guidance"
    }
  ],
  "powershell_remediation_script": "Full executable PowerShell script lines to remediate all identified vulnerabilities on this Windows host."
}`;

    const response = await generateWithRetry(() => ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are a Senior Windows Infrastructure Security Auditor and Cyber Security Specialist specializing in DOH Abu Dhabi ADHICS compliance, CIS Windows Benchmarks, and PowerShell hardening automation.',
        responseMimeType: 'application/json',
      }
    }));

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Received empty response from Gemini AI');
    }

    const parsedResult = JSON.parse(responseText);
    return res.json({ success: true, result: parsedResult });
  } catch (error: any) {
    console.error('[Server API] Error analyzing Windows endpoint posture:', error);
    return res.status(500).json({ error: error.message || 'Failed to analyze endpoint posture' });
  }
});

// Configure Vite integration or build asset serving
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Server] Running in development mode. Initializing Vite middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('[Server] Running in production mode. Serving static assets from /dist...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Active and running on http://localhost:${PORT}`);
  });
}

setupServer();
