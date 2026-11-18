/**
 * The public privacy policy, in English and Ukrainian. Google requires a
 * privacy policy URL to publish the Google sign-in consent screen.
 * Keep it in line with what the code actually stores.
 */
export const PRIVACY_POLICY_UPDATED = '2026-11-18';

export const PRIVACY_POLICY_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Vazon privacy policy</title>
<style>
  :root { color-scheme: light dark; }
  body { font: 16px/1.6 system-ui, -apple-system, Segoe UI, sans-serif; max-width: 42rem; margin: 0 auto; padding: 2rem 1rem 4rem; background: #faf8f2; color: #1f2a1f; }
  @media (prefers-color-scheme: dark) { body { background: #141a14; color: #e6ece4; } a { color: #9fd3a5; } }
  h1 { font-size: 1.8rem; margin-bottom: .25rem; }
  h2 { font-size: 1.15rem; margin-top: 2rem; }
  .muted { opacity: .7; }
  hr { margin: 3rem 0; border: 0; border-top: 1px solid currentColor; opacity: .2; }
</style>
</head>
<body>
<h1>Vazon privacy policy</h1>
<p class="muted">Last updated: ${PRIVACY_POLICY_UPDATED}</p>
<p>Vazon is a houseplant care prototype built by students of the Ukrainian Catholic University as a course project. This page explains what we store and why.</p>

<h2>What we store</h2>
<ul>
  <li><strong>Account:</strong> your email address. If you sign up with a password, we store only a one-way hash of it, never the password itself.</li>
  <li><strong>Google sign-in:</strong> if you use it, we receive only your email address and Google account ID, to find your account next time. We do not receive your Google password, contacts, files or any other data.</li>
  <li><strong>Your plants:</strong> what you enter (names, species, conditions, location, notes, care log) and the photos you upload.</li>
  <li><strong>Settings:</strong> interface language and reminder preferences.</li>
  <li><strong>Feedback:</strong> the message you send, the page you sent it from and your browser's user agent.</li>
</ul>

<h2>How we use it</h2>
<p>Only to run Vazon for you: to sign you in, show your plants and care schedule, and improve the product from feedback. We do not sell or share your data, show ads or use tracking or analytics cookies.</p>

<h2>Storage and cookies</h2>
<p>Data is stored in a PostgreSQL database hosted by Render in Frankfurt (EU). Your sign-in token is kept in your browser's local storage. During Google sign-in we set one short-lived security cookie (10 minutes) to protect the sign-in from forgery.</p>

<h2>Deleting your data</h2>
<p>To delete your account and everything in it, send a request through the “Leave feedback” button on the site, from the account you want deleted. We delete it within 30 days. This is a student prototype: data may also be removed when the prototype is shut down.</p>

<h2>Changes</h2>
<p>If this policy changes, we will update this page and the date above.</p>

<hr>

<h1 lang="uk">Політика конфіденційності Vazon</h1>
<div lang="uk">
<p class="muted">Оновлено: ${PRIVACY_POLICY_UPDATED}</p>
<p>Vazon — прототип застосунку для догляду за кімнатними рослинами, який створили студенти Українського католицького університету як курсовий проєкт. Тут пояснено, які дані ми зберігаємо і навіщо.</p>

<h2>Що ми зберігаємо</h2>
<ul>
  <li><strong>Акаунт:</strong> вашу електронну пошту. Якщо ви реєструєтеся з паролем, ми зберігаємо лише його незворотний хеш, а не сам пароль.</li>
  <li><strong>Вхід через Google:</strong> ми отримуємо лише вашу пошту та ідентифікатор акаунта Google, щоб наступного разу знайти ваш акаунт. Ваш пароль Google, контакти, файли чи інші дані ми не отримуємо.</li>
  <li><strong>Ваші рослини:</strong> те, що ви вводите (назви, види, умови, розташування, нотатки, журнал догляду), і фото, які ви завантажуєте.</li>
  <li><strong>Налаштування:</strong> мову інтерфейсу та параметри нагадувань.</li>
  <li><strong>Відгуки:</strong> текст відгуку, сторінку, з якої його надіслано, і дані про ваш браузер (user agent).</li>
</ul>

<h2>Як ми це використовуємо</h2>
<p>Лише для роботи Vazon: щоб ви могли увійти, бачити свої рослини й розклад догляду, і щоб покращувати продукт за відгуками. Ми не продаємо й не передаємо ваші дані, не показуємо рекламу і не використовуємо cookie для відстеження чи аналітики.</p>

<h2>Зберігання та cookie</h2>
<p>Дані зберігаються в базі PostgreSQL на серверах Render у Франкфурті (ЄС). Токен входу зберігається в локальному сховищі вашого браузера. Під час входу через Google ми ставимо одну короткочасну захисну cookie (10 хвилин), щоб захистити вхід від підробки.</p>

<h2>Видалення даних</h2>
<p>Щоб видалити акаунт і все, що в ньому, надішліть запит через кнопку «Залишити відгук» на сайті з того акаунта, який треба видалити. Ми видалимо його протягом 30 днів. Це студентський прототип: дані також можуть бути видалені, коли прототип перестане працювати.</p>

<h2>Зміни</h2>
<p>Якщо політика зміниться, ми оновимо цю сторінку й дату вище.</p>
</div>
</body>
</html>
`;
