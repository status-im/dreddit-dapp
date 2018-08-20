import {Card, CardActions, CardContent, CardHeader} from '@material-ui/core';
import React, {Component} from 'react';
import Blockies from 'react-blockies';
import CircularProgress from '@material-ui/core/CircularProgress';
import DownvoteIcon from '@material-ui/icons/ExpandMore';
import IconButton from '@material-ui/core/IconButton';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import UpvoteIcon from '@material-ui/icons/ExpandLess';
import dateformat from 'dateformat';
import markdownJS from "markdown";
import {withStyles} from '@material-ui/core/styles';

import EmbarkJS from 'Embark/EmbarkJS';
import DReddit from 'Embark/contracts/DReddit';
import web3 from 'Embark/web3';

const markdown = markdownJS.markdown;

const styles = theme => ({
    actions: {
      marginRight: theme.spacing.unit * 5,
      fontSize: 15,
      display: 'flex'
    },
    card: {
      margin: theme.spacing.unit,
      marginTop: theme.spacing.unit * 4,
      position: 'relative'
    },
    title: {
        borderBottom: '1px solid #ccc',
        color: '#666'
    },
    spinner: {
        position: 'absolute',
        right: theme.spacing.unit * 3
    }
});  

const ballot = {
    NONE: 0,
    UPVOTE: 1,
    DOWNVOTE: 2
};

const contains = (filterBy, content, title, date, owner) => {
    filterBy = filterBy.trim().toLowerCase();
    if(filterBy == '') return true;
    return  content.toLowerCase().indexOf(filterBy) > -1 || 
            title.toLowerCase().indexOf(filterBy) > -1 || 
            date.indexOf(filterBy) > -1 || 
            owner.toLowerCase().indexOf(filterBy) > -1;
};

class Post extends Component {

    constructor(props){
        super(props);

        this.state = {
            title: '',
            content: '',
            isSubmitting: false,
            canVote: true,
            upvotes: props.upvotes,
            downvotes: props.downvotes
        };
    }

    componentDidMount(){
        EmbarkJS.onReady(() => {
            this._loadAttributes();
        });
    }

    _loadAttributes = async () => {
        const ipfsHash = web3.utils.toAscii(this.props.description);

        // Obtain the content from IPFS using the `ipfsHash` variable
        const ipfsText = await EmbarkJS.Storage.get(ipfsHash);
        
        // Data Obtained from IPFS
        const jsonContent = JSON.parse(ipfsText);
        
        const title = jsonContent.title;
        const content = jsonContent.content;

        // Determine if the current account can vote or not
        const canVote = await DReddit.methods.canVote(this.props.id).call();

        this.setState({
            title,
            content,
            canVote
        });
    }

    _vote = choice => async event => {
        event.preventDefault();
        this.setState({isSubmitting: true});

        // Estimate the cost of invoking the function `vote` from the contract
        const {vote} = DReddit.methods;
        const toSend = vote(this.props.id, choice);
        const estimatedGas = await toSend.estimateGas();

        // Send the transaction
        const receipt = await toSend.send({gas: estimatedGas + 1000});
        console.log(receipt);

        this.setState({
            canVote: false,
            upvotes: this.state.upvotes + (choice == ballot.UPVOTE ? 1 : 0),
            downvotes: this.state.downvotes + (choice == ballot.DOWNVOTE ? 1 : 0)
        });

        this.setState({isSubmitting: false});
    }

    render(){
        const {title, content, upvotes, downvotes, isSubmitting, canVote} = this.state;
        const {creationDate, classes, owner, filterBy} = this.props;
        const disabled = isSubmitting || !canVote;
        const formattedDate = dateformat(new Date(creationDate * 1000), "yyyy-mm-dd HH:MM:ss");
        const mdText = markdown.toHTML(content);

        const display = contains(filterBy, content, title, formattedDate, owner);

        return display&& <Card className={classes.card}>
            <CardHeader title={owner} subheader={formattedDate}
                avatar={
                    <Blockies seed={owner} size={7} scale={5} />
                }
                action={
                <IconButton>
                    <MoreVertIcon />
                </IconButton>
              } />
            <CardContent>
                <Typography variant="title"  className={classes.title}  gutterBottom>
                {title}
                </Typography>
                <Typography component="div" dangerouslySetInnerHTML={{__html: mdText}} />
            </CardContent>
            <CardActions disableActionSpacing>
                <IconButton className={classes.actions} disabled={disabled} onClick={this._vote(ballot.UPVOTE)}>
                <UpvoteIcon />
                {upvotes}
                </IconButton>
                <IconButton className={classes.actions} disabled={disabled} onClick={this._vote(ballot.DOWNVOTE)}>
                <DownvoteIcon />
                {downvotes}
                </IconButton>
                { isSubmitting && <CircularProgress size={14} className={classes.spinner} /> }
          </CardActions>
        </Card>;
    }
    
}

Post.propTypes = {
    filterBy: PropTypes.string,
    upvotes: PropTypes.number.isRequired,
    downvotes: PropTypes.number.isRequired,
    classes: PropTypes.object.isRequired,
    id: PropTypes.number.isRequired,
    owner: PropTypes.string.isRequired,
    creationDate: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired
  };
  

export default withStyles(styles)(Post);
