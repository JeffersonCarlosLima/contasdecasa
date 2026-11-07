import * as net from "node:net";
import * as tls from "node:tls";

export interface SendEmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface SendEmailResult {
  sent: boolean;
  error?: string;
}

export function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS,
  );
}

export async function sendEmail(payload: SendEmailPayload): Promise<SendEmailResult> {
  if (!isSmtpConfigured()) {
    return { sent: false };
  }

  const host = process.env.SMTP_HOST!;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER!;
  const pass = process.env.SMTP_PASS!;
  const from = process.env.SMTP_FROM || `"Contas da Casa" <${user}>`;

  return new Promise((resolve) => {
    const isSecure = port === 465;

    function handleDialog(socket: net.Socket | tls.TLSSocket) {
      let buffer = "";

      function send(cmd: string) {
        socket.write(`${cmd}\r\n`);
      }

      function onData(chunk: Buffer) {
        buffer += chunk.toString();
        const lines = buffer.split("\r\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const code = Number(line.slice(0, 3));
          if (line.charAt(3) === "-") continue;

          if (code === 220) {
            send("EHLO localhost");
          } else if (code === 250 && !isSecure && port === 587) {
            send("STARTTLS");
          } else if (code === 220 && !isSecure) {
            // Upgrade to TLS
            const tlsSocket = tls.connect(
              { socket, host, servername: host },
              () => {
                handleDialog(tlsSocket);
              },
            );
            tlsSocket.on("error", (err) => resolve({ sent: false, error: err.message }));
            return;
          } else if (code === 250 || code === 235 || code === 334) {
            if (line.includes("AUTH") || code === 250) {
              send("AUTH LOGIN");
            } else if (code === 334) {
              // prompt for user or pass
              const decoded = Buffer.from(line.slice(4).trim(), "base64").toString().toLowerCase();
              if (decoded.includes("user")) {
                send(Buffer.from(user).toString("base64"));
              } else {
                send(Buffer.from(pass).toString("base64"));
              }
            } else if (code === 235) {
              send(`MAIL FROM:<${user}>`);
            }
          } else if (code === 250 && line.toLowerCase().includes("sender ok")) {
            send(`RCPT TO:<${payload.to}>`);
          } else if (code === 250 && line.toLowerCase().includes("recipient ok")) {
            send("DATA");
          } else if (code === 354) {
            const raw = [
              `From: ${from}`,
              `To: ${payload.to}`,
              `Subject: ${payload.subject}`,
              "MIME-Version: 1.0",
              "Content-Type: text/plain; charset=utf-8",
              "",
              payload.text,
              ".",
            ].join("\r\n");
            send(raw);
          } else if (code === 250 && line.toLowerCase().includes("queued")) {
            send("QUIT");
            resolve({ sent: true });
          }
        }
      }

      socket.on("data", onData);
      socket.on("error", (err) => resolve({ sent: false, error: err.message }));
    }

    try {
      if (isSecure) {
        const socket = tls.connect({ host, port, servername: host }, () => {
          handleDialog(socket);
        });
        socket.on("error", (err) => resolve({ sent: false, error: err.message }));
      } else {
        const socket = net.createConnection({ host, port }, () => {
          handleDialog(socket);
        });
        socket.on("error", (err) => resolve({ sent: false, error: err.message }));
      }
    } catch (err: unknown) {
      resolve({ sent: false, error: err instanceof Error ? err.message : String(err) });
    }
  });
}

export async function sendInviteEmail({
  to,
  familyName,
  link,
}: {
  to: string;
  familyName: string;
  link: string;
}): Promise<SendEmailResult> {
  return sendEmail({
    to,
    subject: `Convite para a família "${familyName}" no Contas da Casa`,
    text: [
      `Olá!`,
      ``,
      `Você recebeu um convite para participar da família "${familyName}" no Contas da Casa.`,
      `Para aceitar e acessar os lançamentos compartilhados, clique no link abaixo:`,
      ``,
      link,
      ``,
      `Este convite é individual e expira em 7 dias.`,
      `Se você não esperava por este convite, pode ignorar este email.`,
    ].join("\n"),
  });
}
