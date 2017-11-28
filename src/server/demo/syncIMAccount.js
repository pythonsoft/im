const UserInfo = require('../api/user/userInfo');

const userInfo = new UserInfo();

const request = require('request');
const TICKET = '8649e68b4adc426b6d8eda111be86f446b66d0f6b89f40334ef5fb6ad1b567c57971ca985a8b7bb9ff39b546de4a959984b97880257b83c99b9cbe407ba8797d';

userInfo.collection.find({}).toArray((err, docs) => {
  if(err) {
    console.log('collections error -->', err);
    return false;
  }

  for(let i = 0, len = docs.length; i < len; i++) {

    request.post({ url: 'http://localhost:9000/im/sync', form: {
      ticket: TICKET,
      key: 'ump',
      id: docs[i]._id,
      name: docs[i].name,
      photo: docs[i].photo,
      email: docs[i].email,
      phone: docs[i].phone
    }}, (err, res, body) => {
      if(err) {
        console.error(err);
        return false;
      }

      console.log('add success user id: ', docs[i].name, body);

      return false;
    });
  }

});

