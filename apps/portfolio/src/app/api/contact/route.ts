import { RateLimiter } from '@/lib/rate-limiter';
import { type } from 'arktype';
import FormData from 'form-data';
import Mailgun from 'mailgun.js';
import { NextRequest, NextResponse } from 'next/server';

const rateLimiter = new RateLimiter();

const MessageResponse = type({
  message: 'string',
});

export async function POST(req: NextRequest) {
  // https://github.com/vercel/next.js/discussions/55037#discussioncomment-6922202
  const ip = (req.headers.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0];
  if (!ip) {
    console.error('Missing IP');
    return NextResponse.json({ status: 500 });
  }

  const result = rateLimiter.consume(ip);

  // Too many requests
  if (!result.success) {
    return NextResponse.json(result, { status: 429 });
  }

  const response = MessageResponse(await req.json());
  if (response instanceof type.errors) {
    throw Error(response.summary);
  }
  if (!response.message) {
    return new NextResponse('Message is required', { status: 400 });
  }

  try {
    await sendEmail(response.message);
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(error, { status: 500 });
  }

  return NextResponse.json({}, { status: 200 });
}

async function sendEmail(message: string) {
  const mailgun = new Mailgun(FormData);

  const api_key = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;

  // Check params
  if (!api_key) throw new Error('MAILGUN_API_KEY is required');
  if (!domain) throw new Error('MAILGUN_DOMAIN is required');

  const client = mailgun.client({
    username: 'api',
    key: api_key,
  });

  const result = await client.messages.create(domain, {
    from: `Portfolio Contact Form <postmaster@${domain}>`,
    to: 'Aria Amini <aamini1024@gmail.com>',
    subject: 'New Contact Form Submission',
    text: message,
  });
  console.log(result);
}
