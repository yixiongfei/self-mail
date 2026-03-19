import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import http from 'http';
import os from 'os';

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const TOKEN_PATH = path.join(__dirname, '../../data/token.json');
const CREDENTIALS_PATH = path.join(__dirname, '../../data/credentials.json');
const REDIRECT_URI = 'http://localhost:3002/oauth2callback';

// Singleton: if an OAuth flow is already in progress, reuse the same promise
let ongoingAuth: Promise<InstanceType<typeof google.auth.OAuth2>> | null = null;

export async function getAuthClient() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error(`credentials.json not found at ${CREDENTIALS_PATH}`);
  }

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
  const { client_secret, client_id } = credentials.installed ?? credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, REDIRECT_URI);

  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  }

  if (ongoingAuth) {
    console.log('OAuth flow already in progress, waiting...');
    return ongoingAuth;
  }

  ongoingAuth = authorizeNewToken(oAuth2Client).finally(() => {
    ongoingAuth = null;
  });
  return ongoingAuth;
}

async function authorizeNewToken(oAuth2Client: InstanceType<typeof google.auth.OAuth2>) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    redirect_uri: REDIRECT_URI,
  });

  const code = await new Promise<string>((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (!req.url?.startsWith('/oauth2callback')) return;
      const url = new URL(req.url, 'http://localhost:3002');
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      if (error) {
        res.end(`<h2 style="color:red">エラー: ${error}</h2><p>このタブを閉じてください。</p>`);
        server.close();
        reject(new Error('OAuth error: ' + error));
        return;
      }
      if (code) {
        res.end(`<h2 style="color:green">認証成功！このタブを閉じてください。</h2>`);
        server.close();
        resolve(code);
      }
    });

    server.on('error', reject);

    server.listen(3002, '127.0.0.1', async () => {
      console.log('\n=== Gmail 認証が必要です ===');
      console.log('ブラウザが自動で開きます...');
      // Write a redirect HTML to avoid & being mangled by Windows shell
      const tmpHtml = path.join(os.tmpdir(), 'smbc-oauth.html');
      fs.writeFileSync(tmpHtml,
        `<!DOCTYPE html><html><head>` +
        `<meta http-equiv="refresh" content="0;url=${authUrl}">` +
        `</head><body><p>Redirecting... <a href="${authUrl}">Click here if not redirected</a></p></body></html>`
      );
      try {
        const { default: open } = await import('open');
        await open(tmpHtml);
        console.log('ブラウザが開きました。Google アカウントで許可してください。');
      } catch {
        console.log('\nブラウザを開けませんでした。以下の URL をブラウザにコピーしてください:');
        console.log(authUrl);
      }
    });
  });

  const { tokens } = await oAuth2Client.getToken({ code, redirect_uri: REDIRECT_URI });
  oAuth2Client.setCredentials(tokens);
  fs.mkdirSync(path.dirname(TOKEN_PATH), { recursive: true });
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  console.log('トークンを保存しました:', TOKEN_PATH);
  return oAuth2Client;
}
