import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendOrderApproved(email: string, orderId: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Tu pedido está listo para retirar',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #ffffff; padding: 20px; border: 2px solid #000000; border-radius: 8px; max-width: 600px; margin: auto;">
          <!-- Encabezado -->
          <div style="background-color: #D32F2F; padding: 15px; text-align: center; color: #ffffff; border-radius: 6px 6px 0 0;">
            <h1 style="margin: 0; font-size: 22px;">RepuStore 🚗🔧</h1>
          </div>

          <!-- Cuerpo -->
          <div style="padding: 20px; text-align: center; color: #000000;">
            <h2 style="margin-bottom: 10px; color: #D32F2F;">¡Pedido aprobado!</h2>
            <p style="font-size: 16px; margin: 10px 0;">
              Tu pedido con ID <b style="color: #000000;">${orderId}</b> ya está 
              <span style="color: #D32F2F; font-weight: bold;">listo para retirar</span>.
            </p>
            <p style="font-size: 15px; margin-top: 20px;">
              Gracias por confiar en <b style="color: #D32F2F;">RepuStore</b>.  
              ¡Te esperamos pronto!
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #000000; color: #ffffff; padding: 10px; text-align: center; border-radius: 0 0 6px 6px; font-size: 13px;">
            © 2025 RepuStore - Todos los derechos reservados
          </div>
        </div>
      `,
    });
  }
}
