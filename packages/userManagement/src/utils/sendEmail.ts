import nodemailer from 'nodemailer';

interface SendEmailInput {
    email: string;
    html: string;
    subject: string;
}

const sendEmail = async ({ email, html, subject }: SendEmailInput): Promise<any> => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465, // or 587
            secure: true,
            auth: {
                // TODO: replace `user` and `pass` values from <https://forwardemail.net>
                user: process.env.EMAIL_NAME!,
                pass: process.env.EMAIL_APP_PASSWORD!,
            },
        });

        const info = await transporter.sendMail({
            from: '"iot-callbot-node" <no-reply@iot-callbot-node.com>', // sender address
            to: email, // list of receivers
            subject: subject,//'Forgot password', // Subject line
            html: html, // html body
        });

        return info;
    } catch (error) {
        console.log(error);
    }
};

export default sendEmail;
