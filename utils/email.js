// eslint-disable-next-line import/no-extraneous-dependencies
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  //1 create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    //ACTIVATE IN GMAIL "LESS SURE APP" OPTION
  });
  //2 define email options
  const mailOptions = {
    from: 'Wilson Dagah',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };
  //3 send the email wihh nodemailer
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
