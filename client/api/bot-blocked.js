export const config = {
  runtime: 'edge',
}

export default function handler() {
  return new Response(
    '<!DOCTYPE html><html><head><title>Wedding Counselors</title></head>' +
      '<body style="font-family:sans-serif;max-width:600px;margin:80px auto;padding:20px;text-align:center">' +
      '<h1>Wedding Counselors</h1>' +
      '<p>Our directory currently serves couples in the United States.</p>' +
      '<p>If you believe this is an error, please contact ' +
      '<a href="mailto:hello@weddingcounselors.com">hello@weddingcounselors.com</a></p>' +
      '</body></html>',
    {
      status: 403,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store',
      },
    }
  )
}
