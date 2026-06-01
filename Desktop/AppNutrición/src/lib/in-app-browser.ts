// Detección de navegadores embebidos (in-app webviews) como el de LinkedIn,
// Instagram o Facebook. Google bloquea "Iniciar sesión con Google" dentro de
// estos navegadores (error disallowed_useragent / "navegadores seguros"), así
// que detectamos el caso para avisar al usuario y ofrecerle el registro por email.
//
// Solo detectamos apps concretas por su marca en el user-agent: es fiable y no
// da falsos positivos con Safari/Chrome normales.

type InAppPattern = { name: string; test: RegExp };

const IN_APP_PATTERNS: InAppPattern[] = [
  { name: "LinkedIn", test: /LinkedInApp/i },
  { name: "Instagram", test: /Instagram/i },
  { name: "Facebook", test: /\bFBAN\b|\bFBAV\b|FB_IAB/i },
  { name: "Messenger", test: /Messenger/i },
  { name: "TikTok", test: /BytedanceWebview|musical_ly|TikTok|Bytedance/i },
  { name: "X", test: /\bTwitter\b/i },
  { name: "Snapchat", test: /Snapchat/i },
  { name: "WhatsApp", test: /WhatsApp/i },
  { name: "WeChat", test: /MicroMessenger/i },
  { name: "Pinterest", test: /Pinterest/i },
  { name: "Line", test: /\bLine\//i },
];

export type InAppBrowserInfo = { inApp: boolean; app: string | null };

export function detectInAppBrowser(ua: string | undefined | null): InAppBrowserInfo {
  if (!ua) return { inApp: false, app: null };
  for (const pattern of IN_APP_PATTERNS) {
    if (pattern.test.test(ua)) return { inApp: true, app: pattern.name };
  }
  return { inApp: false, app: null };
}
