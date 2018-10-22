/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';

const expect = require('chai').expect;
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const shortid = require('shortid');

// Connect to DB.
mongoose.connect(
    process.env.MONGO_URI || process.env.MONGO_LOCAL,
    { useNewUrlParser: true }
);

// Issue Tracker - Schemas
const BookSchema = new Schema({
  _id: {
    type: Schema.Types.Mixed,
    default: shortid.generate
  },
  title: { type: String, required: true },
  comments: [{ type: String }],
});
const Books = mongoose.model('Books', BookSchema);

module.exports = function (app) {

  // Async function to Create a Book.
  function createBook(title) {
    return new Promise((resolve, reject) => {
      let bookToSave = new Books({ title });
      bookToSave.save((err, data) =>
          err ? reject(null) : resolve(data));
    });
  }

  // Async function to get Book by bookid.
  function findBookById(bookid) {
    return new Promise((resolve, reject) => {
      Books.findById(
          bookid,
          (err, book) => err ? reject(null) : resolve(book)
      );
    });
  }

  // Async function to delete Issue by _id.
  function deleteBookById(bookid) {
    return new Promise((resolve, reject) => {
      Books.findOneAndDelete(
          { _id: bookid },
          (err, book) => err ? reject(null) : resolve(book)
      );
    });
  }

  app.route('/api/books')
    .get((req, res) => {
      //response will be array of book objects
      Books.find({}, (err, books) => {
            if (err) {
              res.json({error: 'error finding books'});
            }
            else {
              let BookResult = [];
              books.forEach((book) => {
                BookResult.push({
                  "_id": book._id,
                  "title": book.title,
                  "commentcount": book.comments.length
                });
              });
              res.json(BookResult);
            }
          })
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
    })
    
    .post(async function (req, res) {
      let title = req.body.title;
      if (title) {
        let createdBook = await createBook(title);
        if (createdBook !== null) {
          res.send(createdBook);
        }
        else {
          res.json({ error: 'error saving book'});
        }
      }
      else {
        res.json({error: 'no title given'});
      }
      //response will contain new book object including at least _id and title
    })
    
    .delete(function(req, res) {
      //if successful response will be 'complete delete successful'
      Books.deleteMany( { } , (err, books) =>
          err ?
              res.send('complete delete error') :
              res.send('complete delete successful')
      );
    });



  app.route('/api/books/:id')
    .get(async function (req, res) {
      let bookid = req.params.id;
      let bookFound = await findBookById(bookid);
      if (bookFound) {
        res.json(bookFound)
      }
      else {
        res.json({error: "no book exists"})
      }
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
    })
    
    .post(async function(req, res){
      let bookid = req.params.id;
      let comment = req.body.comment;
      if (bookid && comment) {
        let bookFound = await findBookById(bookid);
        if (bookFound) {
          bookFound.comments.push(comment);
          bookFound.save((err, data) =>
              err ?
                  res.json({error: "no book exists"}) :
                  res.json(data)
          );
        }
        else {
          res.json({error: "no book exists by that id"})
        }
      }
    })
    
    .delete(async function(req, res){
      let bookid = req.params.id;
      let bookDeleted = await deleteBookById(bookid);
      if (bookDeleted !== null) {
        res.send('delete successful')
      }
      else {
        res.json({error: 'could not delete ' + bookid})
      }
      //if successful response will be 'delete successful'
    });
  
};
