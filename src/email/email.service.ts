import { Injectable } from '@nestjs/common';
import { Transporter, createTransport } from 'nodemailer'

@Injectable()
export class EmailService {

  transporter: Transporter

  constructor() {
    this.transporter = createTransport({
      host: 'smtp.qq.com',
      port: 587,
      secure: false,
      auth: {
        user: '1209642293@qq.com',
        pass: 'mjytpkfrzaqsbadb'
      }
    })
  }

  async sendMail({to, subject, html}) {
    await this.transporter.sendMail({
      from: {
        name: '会议室预订系统',
        addess: '1209642293@qq.com'
      },
      to,
      subject,
      html
    })
  }
}