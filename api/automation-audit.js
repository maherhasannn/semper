import Redis from 'ioredis';
import { Resend } from 'resend';

const redis = new Redis(process.env.REDIS_URL);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, teamSize, hoursPerWeek, monthlySavings } = req.body;

    if (!email || !teamSize || !hoursPerWeek) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Store lead in Redis
    const leadId = `lead:${Date.now()}`;
    const leadData = {
      email,
      teamSize,
      hoursPerWeek,
      monthlySavings,
      createdAt: new Date().toISOString(),
      source: 'automation-audit',
    };

    await redis.hset(leadId, leadData);
    await redis.lpush('leads:automation-audit', leadId);

    // Calculate report data
    const hourlyRate = 35;
    const efficiencyGain = 0.30;
    const annualSavings = monthlySavings * 12;
    const hoursReclaimed = Math.round(hoursPerWeek * efficiencyGain * 52);
    const fteSaved = (hoursReclaimed / 2080).toFixed(1);

    // Send email with report
    await resend.emails.send({
      from: 'Ed at Semperr <ed@semperr.com>',
      to: email,
      subject: 'Your Automation Audit Report - Semperr',
      html: generateReportEmail({
        teamSize,
        hoursPerWeek,
        monthlySavings,
        annualSavings,
        hoursReclaimed,
        fteSaved,
        hourlyRate,
        efficiencyGain,
      }),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Automation audit error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function generateReportEmail(data) {
  const {
    teamSize,
    hoursPerWeek,
    monthlySavings,
    annualSavings,
    hoursReclaimed,
    fteSaved,
    hourlyRate,
    efficiencyGain,
  } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Your Automation Audit</h1>
              <p style="color: #888888; margin: 10px 0 0; font-size: 16px;">Prepared by Semperr</p>
            </td>
          </tr>

          <!-- Executive Summary -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #0a0a0a; margin: 0 0 20px; font-size: 20px; font-weight: 600;">Executive Summary</h2>
              <p style="color: #444444; line-height: 1.6; margin: 0 0 20px;">
                Based on your input of <strong>${teamSize} team members</strong> spending <strong>${hoursPerWeek} hours per week</strong> on repetitive administrative tasks, we've identified significant automation opportunities for your organization.
              </p>
            </td>
          </tr>

          <!-- Key Metrics -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding: 20px; background-color: #f8f9fa; border-radius: 8px; text-align: center;">
                    <div style="font-size: 32px; font-weight: 700; color: #0a0a0a;">$${monthlySavings.toLocaleString()}</div>
                    <div style="font-size: 14px; color: #666666; margin-top: 5px;">Monthly Savings</div>
                  </td>
                  <td width="10"></td>
                  <td width="50%" style="padding: 20px; background-color: #f8f9fa; border-radius: 8px; text-align: center;">
                    <div style="font-size: 32px; font-weight: 700; color: #0a0a0a;">$${annualSavings.toLocaleString()}</div>
                    <div style="font-size: 14px; color: #666666; margin-top: 5px;">Annual Savings</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 40px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding: 20px; background-color: #f8f9fa; border-radius: 8px; text-align: center;">
                    <div style="font-size: 32px; font-weight: 700; color: #0a0a0a;">${hoursReclaimed.toLocaleString()}</div>
                    <div style="font-size: 14px; color: #666666; margin-top: 5px;">Hours Reclaimed/Year</div>
                  </td>
                  <td width="10"></td>
                  <td width="50%" style="padding: 20px; background-color: #f8f9fa; border-radius: 8px; text-align: center;">
                    <div style="font-size: 32px; font-weight: 700; color: #0a0a0a;">${fteSaved}</div>
                    <div style="font-size: 14px; color: #666666; margin-top: 5px;">FTE Equivalent Saved</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Methodology -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <h2 style="color: #0a0a0a; margin: 0 0 20px; font-size: 20px; font-weight: 600;">Our Methodology</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; padding: 20px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #444444; line-height: 1.8; margin: 0;">
                      <strong>Hourly Cost Baseline:</strong> $${hourlyRate}/hour (industry average for administrative work)<br><br>
                      <strong>Efficiency Target:</strong> ${efficiencyGain * 100}% reduction in manual task time<br><br>
                      <strong>Calculation:</strong> ${hoursPerWeek} hours x $${hourlyRate} x 4 weeks x ${efficiencyGain * 100}% = $${monthlySavings.toLocaleString()}/month
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Automation Opportunities -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <h2 style="color: #0a0a0a; margin: 0 0 20px; font-size: 20px; font-weight: 600;">Top Automation Opportunities</h2>

              <div style="border-left: 3px solid #0a0a0a; padding-left: 20px; margin-bottom: 20px;">
                <h3 style="color: #0a0a0a; margin: 0 0 8px; font-size: 16px;">1. Data Entry & Processing</h3>
                <p style="color: #666666; margin: 0; font-size: 14px; line-height: 1.6;">Automate repetitive data entry between systems, reducing errors and freeing up 40-60% of manual processing time.</p>
              </div>

              <div style="border-left: 3px solid #0a0a0a; padding-left: 20px; margin-bottom: 20px;">
                <h3 style="color: #0a0a0a; margin: 0 0 8px; font-size: 16px;">2. Report Generation</h3>
                <p style="color: #666666; margin: 0; font-size: 14px; line-height: 1.6;">Automated reporting dashboards that pull real-time data, eliminating hours of manual compilation.</p>
              </div>

              <div style="border-left: 3px solid #0a0a0a; padding-left: 20px; margin-bottom: 20px;">
                <h3 style="color: #0a0a0a; margin: 0 0 8px; font-size: 16px;">3. Email & Communication Workflows</h3>
                <p style="color: #666666; margin: 0; font-size: 14px; line-height: 1.6;">Smart routing, auto-responses, and AI-assisted drafting to handle routine communications.</p>
              </div>

              <div style="border-left: 3px solid #0a0a0a; padding-left: 20px;">
                <h3 style="color: #0a0a0a; margin: 0 0 8px; font-size: 16px;">4. Document Processing</h3>
                <p style="color: #666666; margin: 0; font-size: 14px; line-height: 1.6;">AI-powered extraction, categorization, and filing of documents across your organization.</p>
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); border-radius: 8px;">
                <tr>
                  <td style="padding: 30px; text-align: center;">
                    <h3 style="color: #ffffff; margin: 0 0 10px; font-size: 18px;">Ready to capture these savings?</h3>
                    <p style="color: #888888; margin: 0 0 20px; font-size: 14px;">Let's discuss your specific automation opportunities.</p>
                    <a href="https://semperr.com/contact-us" style="display: inline-block; background-color: #ffffff; color: #0a0a0a; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">Schedule a Free Consultation</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; text-align: center;">
              <p style="color: #888888; margin: 0; font-size: 12px;">
                Semperr | The Team That Scales with You<br>
                Malibu, Los Angeles | hello@semperr.com | (760) 791-5525
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
