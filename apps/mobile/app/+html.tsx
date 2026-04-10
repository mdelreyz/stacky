import { ScrollViewStyleReset } from 'expo-router/html';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
html, body, #root {
  min-height: 100%;
}

body {
  margin: 0;
  background:
    radial-gradient(circle at 12% 18%, rgba(126, 188, 226, 0.22), transparent 28%),
    radial-gradient(circle at 84% 22%, rgba(139, 224, 228, 0.18), transparent 24%),
    radial-gradient(circle at 30% 72%, rgba(255, 201, 132, 0.14), transparent 26%),
    linear-gradient(180deg, #fbfdff 0%, #f3f8fc 48%, #eef4f9 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #1a2332;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.52), rgba(255,255,255,0.1)),
    radial-gradient(circle at top right, rgba(255,255,255,0.65), transparent 26%);
  z-index: 0;
}

#root {
  position: relative;
  z-index: 1;
}`;
