import express from 'express';
import bodyParser from 'body-parser';
import {MongoClient} from 'mongodb';

const connString = 'mongodb://142.93.161.125:27017';
const maxVotes = 3;


MongoClient.connect(connString, {useNewUrlParser:true}, function (err, client) {
    if (err) throw err;

    const db = client.db('tshirts');
    const collection = db.collection('tshirts');

    const router = express.Router();
    router.get('/score/:tshirt', (req, res) => {
        const params = req.params;
        collection.find({id: params.tshirt}).project({score: 1}).toArray((err, document) => {
            if(err){
                res.status(500)
                .send({
                    success: false,
                    error: err
                });
            } else {
                console.log(document);
                res.status(200)
                    .send({
                        success: true,
                        tshirt: document
                    });
            }
        });
    });

    router.post('/vote', (req, res) => {
        const vote = req.body;
        const choice = vote.selection > 0 ? 1 : -1;

        collection.aggregate([
            {$unwind: '$votes'},
            {$match: {'votes.account': vote.account}},
            {$group: {_id: '$votes.account', sum: {$sum: 1}}}
        ]).toArray((err, result) => {
            if(err){
                res.status(500)
                .send({
                    success: false,
                    error: err
                });
            } else {
                if(result.length == 0 || result[0].sum < maxVotes){
                    collection.updateOne(
                        {'id': vote.id},
                        {
                            '$inc': {score: choice},
                            '$push': {'votes': {'account': vote.account, choice}}
                        },
                        (err) => {
                            if(err){
                                res.status(500)
                                .send({
                                    success: false,
                                    error: err
                                });
                            } else {
                                res.status(200)
                                .send({
                                    success: true
                                });
                            }
                        }
                     );
                } else {
                    res.status(200)
                    .send({
                        success: false,
                        message: 'Account has already voted'
                    });
                }
            }
        });
    });

    router.post('/tshirt', (req, res) => {
        const tshirt = req.body;
        collection.insertOne({
                id: tshirt.id,
                score: 0,
                votes: []
            }, (err) => {
                if(err){
                    res.status(500)
                       .send({
                           success: false,
                           error: err
                       });
                } else {
                    res.status(200)
                       .send({
                           success: true
                       });
                }
            });
    });

    const app = express();
    const port = process.env.PORT || 3000;

    app.use(bodyParser.urlencoded({extended: false}));
    app.use(bodyParser.json());
    app.use('/', router);

    app.listen(port, () => {
        console.log('Server listening on port ' + port);
    });
});
