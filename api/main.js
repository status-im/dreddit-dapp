import express from 'express';
import bodyParser from 'body-parser';
import {MongoClient} from 'mongodb';
import config from './config';

MongoClient.connect(config.connString, {useNewUrlParser:true}, function (err, client) {
    if (err) throw err;

    const db = client.db('tshirts');
    const collection = db.collection('tshirts');

    const router = express.Router();

    router.get('/', (req, res) => {
        res.redirect(config.dappUrl);
    });

    router.get('/votes/:account', (req, res) => {
        const params = req.params;

        collection.find({'votes.account': {"$all" : [params.account]}})
            .project({id: 1})
            .toArray((err, document) => {
                if(err){
                    res.status(500)
                    .send({
                        success: false,
                        error: err
                    });
                } else {
                    res.status(200)
                        .send({
                            success: true,
                            votes: document.map(val => val.id)
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
                if(result.length == 0 || result[0].sum < config.maxVotes){
                    collection.updateOne(
                        {'id': vote.id},
                        {
                            '$inc': {score: choice},
                            '$push': {'votes': {'account': vote.account, wallet: vote.wallet, choice}}
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

    router.get('/isManager/:account', (req, res) => {
        const params = req.params;
        res.status(200)
            .send({
                success: true,
                result: config.managers.includes(params.account)
            });
    });

    router.get('/tshirts', (req, res) => {
        collection.find()
            .project({id: 1, title: 1, score: 1})
            .toArray((err, document) => {
                if(err){
                    res.status(500)
                    .send({
                        success: false,
                        error: err
                    });
                } else {
                    res.status(200)
                        .send({
                            success: true,
                            votes: document
                        });
                    }
            });
    });

    router.post('/tshirt', (req, res) => {
        const tshirt = req.body;

        if(!config.managers.includes(tshirt.account)){
            res.status(500)
            .send({
                success: false,
                error: "Invalid account"
            });
            return;
        }

        collection.insertOne({
                id: tshirt.id,
                title: tshirt.title,
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


    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

    app.use(bodyParser.urlencoded({extended: false}));
    app.use(bodyParser.json());
    app.use('/', router);

    app.listen(port, () => {
        console.log('Server listening on port ' + port);
    });
});
