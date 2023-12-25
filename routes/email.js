var express = require("express");
var router = express.Router();
const nodemailer = require("nodemailer");
const bookModel=require('../models/Book');
const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true,
    auth: {
      user: "afzaal@thewhitegrapes.com",
      pass: "9Xwt3ve0@@#",
    },
  });
router.get('/',(req,res)=>{
  res.send('Hello');
})

router.post('/send_email',async (req,res)=>{
  try {
    const info = await transporter.sendMail({
      from: "afzaal@thewhitegrapes.com",
      to: "noreply@thewhitegrapes.com", 
      replyTo:req.body.email,
      subject: "Book Store Inquiry Form", 
      text: "This message is from "+req.body.name+ " and the message is as follows : " + req.body.message
    });
    res.status(200).json({status:true});
  } catch (error) {
    res.status(500).json({status:false});
  }
})

router.post('/sendBookEmail',async (req,res)=>{
  try {
    const BookISN=req.body.id;
    console.log("Book ISBN : ",BookISN);
    await bookModel.aggregate([
      { 
        $lookup:
          {
             from: "comments",
             localField: "BookISBN",
             foreignField: "BookISBN",
             as: "CommentData"
          }
       }
  ]).then(async (data)=>{
    var data=data.filter(data => data.BookISBN==req.body.id);
    console.log(`${process.env.REACT_APP_API_BASE_URL}${data[0].BookImage}`);
    const info = await transporter.sendMail({
      from: "afzaal@thewhitegrapes.com",
      to: "noreply@thewhitegrapes.com",
      subject: "Book Information against Book ISBN : "+req.body.id, 
      html : `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; color: white;">
      <div style="width: 100%; color: white; background-color: #5A7887; padding: 20px;">
        <h3 style="margin: 0; text-align: center;">Book Information</h3>
      </div>
    
      <div style="padding: 20px; background-color: #5A7887;">
        <h4 style="color: white;"><b>Book Title:</b> ${data[0].BookTitle}</h4>
    
        <div style="text-align: center;">
          <img src='${process.env.REACT_APP_API_BASE_URL}${data[0].BookImage}' alt="Book Image" style="width: 350px; margin-bottom: 20px;">
        </div>
    
        <h4 style="color: white;"><b>Book ISBN:</b> ${data[0].BookISBN}</h4>
        <p style="color: white;"><b>Written By - </b>${data[0].BookAuthor}</p>
        <p style="color: white;"><b>Book Genre - </b>${data[0].BookGenre}</p>
        <p style="color: white; text-align: justify;"><b>Book Summary - </b>${data[0].BookSummary}</p>
        <p style="color: white;"><b>Book URL - </b>
          ${data[0].BookLink.endsWith('.pdf') ?
            `<a target='_blank' href='${data[0].BookLink}' style="text-decoration: none; color: white; background-color: #28a745; padding: 8px 12px; border-radius: 4px;">View PDF</a>` :
            `<a target='_blank' href='${data[0].BookLink}' style="text-decoration: none; color: white; background-color: #28a745; padding: 8px 12px; border-radius: 4px;">Visit Website</a>`}
        </p>
      </div>
    
      <div style="margin-top: 20px; padding: 20px; background-color: #5A7887;">
        <h4 style="color: white;">Latest Comments</h4>
        ${data[0].CommentData?.length > 0 ? data[0].CommentData.map((comment, index) => (
          `<div style="margin-bottom: 10px; background-color: #5A7887;">
             <p style="color: white;">${comment.Comment}</p>
             <p style="color: white;">Commented By: ${comment.UserName}</p>
           </div>`
        )).join('') : '<p style="color: white;">No comments available</p>'}
      </div>
    </div>    
`
    });
    console.log(info);
    res.status(200).json({status:true,info});
  });
  } catch (error) {
    console.log(error);
      res.status(500).json({status:false,messsage:"Internal Server Error 500",error:error});
  }
})

module.exports = router;