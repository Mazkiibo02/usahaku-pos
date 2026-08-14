import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: 'Usahaku <onboarding@resend.dev>',
      to: email,
      subject: 'Selamat Datang di Usahaku! 🎉',
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0f172a;">Selamat datang, ${name}!</h2>
          <p>Terima kasih telah mendaftar di <strong>Usahaku</strong>. Kami sangat senang Anda bergabung bersama kami.</p>
          <p>Dengan Usahaku, Anda bisa mengelola kasir dan inventaris toko Anda dengan lebih mudah dan efisien.</p>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <h3 style="margin-top: 0; color: #1e293b;">Informasi Kuota Gratis Anda</h3>
            <p style="margin-bottom: 0;">Sebagai pengguna paket Freemium (Gratis Selamanya), Anda mendapatkan kuota gratis sebesar <strong>50 transaksi per bulan</strong>. Kuota ini akan di-reset setiap awal bulan.</p>
          </div>
          
          <p>Jika bisnis Anda berkembang dan membutuhkan transaksi lebih dari itu, Anda dapat mempertimbangkan untuk beralih ke paket berbayar di masa mendatang tanpa takut kehilangan data.</p>
          
          <p>Selamat mencoba, semoga bisnis Anda semakin sukses!</p>
          
          <br />
          <p>Salam sukses,</p>
          <p><strong>Tim Usahaku</strong></p>
        </div>
      `,
    });

    if (error) {
      console.error('[send-welcome-email] Resend error:', error);
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[send-welcome-email] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
