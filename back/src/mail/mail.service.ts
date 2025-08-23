/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import PDFDocument from 'pdfkit';
import { Buffer } from 'buffer';
import { Orders } from 'src/orders/entities/order.entity';

@Injectable()
export class MailService {
  private frontendUrl: string;
  private storeMail: string;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    this.storeMail =
      this.configService.get<string>('MAIL_USER') || 'repustore2@gmail.com';
  }

  // Helper de moneda (ajustá moneda si corresponde)
  private money(n: number) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  }

  // ✅ Genera el PDF con nombre del cliente + items + total
  private async generateInvoicePdf(order: Orders): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Uint8Array[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Encabezado
      doc.fontSize(20).text('Factura - RepuStore 🚗🔧', { align: 'center' });
      doc.moveDown();

      // Datos del cliente / orden
      const customerName = order.user?.name || 'Cliente';
      const customerEmail = order.user?.email || '';
      const orderDate = (order.date && new Date(order.date)) || new Date();

      doc
        .fontSize(12)
        .text(`Orden ID: ${order.id}`)
        .text(`Cliente: ${customerName}`)
        .text(`Email: ${customerEmail}`)
        .text(`Fecha: ${orderDate.toLocaleString('es-AR')}`);
      doc.moveDown();

      // Encabezados de la "tabla"
      const xDesc = 50,
        xQty = 350,
        xUnit = 410,
        xSub = 500;
      doc
        .fontSize(12)
        .text('Producto', xDesc)
        .text('Cant.', xQty)
        .text('Precio', xUnit)
        .text('Subtotal', xSub);
      doc
        .moveTo(50, doc.y + 3)
        .lineTo(560, doc.y + 3)
        .stroke();
      doc.moveDown(0.5);

      // Items
      const items = order.orderDetails?.items || [];
      let total = 0;

      items.forEach((it) => {
        const name = it.product?.name || 'Producto';
        const qty = it.quantity || 0;
        const unit = Number(it.unitPrice) || 0;
        const sub = unit * qty;
        total += sub;

        doc
          .text(name, xDesc, doc.y)
          .text(`${qty}`, xQty)
          .text(this.money(unit), xUnit)
          .text(this.money(sub), xSub);
      });

      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke();
      doc.moveDown();

      // Total
      doc.fontSize(13).text(`TOTAL: ${this.money(total)}`, { align: 'right' });

      doc.moveDown();
      doc.fontSize(11).text('¡Gracias por tu compra!', { align: 'center' });

      doc.end();
    });
  }

  /** ✅ Enviar correo de orden aprobada (cliente + MAIL_USER) con PDF */
  async sendOrderApproved(order: Orders) {
    const pdfBuffer = await this.generateInvoicePdf(order);
    const userEmail = order.user?.email;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const recipients = [userEmail, this.storeMail].filter(Boolean) as string[];

    await this.mailerService.sendMail({
      to: recipients,
      subject: `✅ Pedido aprobado - #${order.id}`,
      html: `
<div style="font-family: Arial, sans-serif; background-color: #ffffff; padding: 20px; border-radius: 8px; max-width: 600px; margin: auto; border: 1px solid #ddd; color: #000000;">

  <!-- Encabezado -->
  <div style="background-color: #D32F2F; padding: 15px; text-align: center; color: #ffffff; border-radius: 6px 6px 0 0;">
    <h1 style="margin: 0; font-size: 22px;">RepuStore 🚗🔧</h1>
  </div>

  <!-- Cuerpo -->
  <div style="padding: 20px; text-align: center;">
    <h2 style="margin-bottom: 10px; color: #D32F2F;">¡Tu pedido está aprobado!</h2>
    <p style="font-size: 16px; margin: 10px 0; color: #000;">
      El pedido con ID <b>${order.id}</b> ya está 
      <span style="color: #D32F2F; font-weight: bold;">listo para retirar</span>.
    </p>
    <p style="font-size: 15px; margin-top: 20px; color: #000;">
      Gracias por confiar en <b style="color: #D32F2F;">RepuStore</b>. 
      Puedes ver los detalles desde tu perfil:
    </p>
    <a href="${this.frontendUrl}/profile" 
       style="display:inline-block; margin-top:15px; padding:12px 25px; background:#000000; color:#ffffff; text-decoration:none; font-weight:bold; border-radius:5px;">
       🔎 Ver mis órdenes
    </a>
  </div>

  <!-- Footer -->
  <div style="background-color: #D32F2F; color: #fff; padding: 10px; text-align: center; border-radius: 0 0 6px 6px; font-size: 13px;">
    © 2025 RepuStore - Todos los derechos reservados
  </div>

</div>
`,

      attachments: [
        {
          filename: `Factura-${order.id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  }
}
