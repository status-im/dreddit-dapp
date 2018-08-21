import {Card, CardContent, CardHeader} from '@material-ui/core';
import React, {Component} from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';
import DownvoteIcon from '@material-ui/icons/ExpandMore';
import IconButton from '@material-ui/core/IconButton';
import Image from 'material-ui-image';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import UpvoteIcon from '@material-ui/icons/ExpandLess';
import {withStyles} from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';

import EmbarkJS from 'Embark/EmbarkJS';
import DReddit from 'Embark/contracts/DReddit';
import web3 from 'Embark/web3';

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

const contains = (filterBy, title) => {
    filterBy = filterBy.trim().toLowerCase();
    if(filterBy == '') return true;
    return  title.toLowerCase().indexOf(filterBy) > -1;
};

class Post extends Component {

    constructor(props){
        super(props);

        this.state = {
            title: '',
            image: '',
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
        const image = EmbarkJS.Storage.getUrl(jsonContent.image);

        // Determine if the current account can vote or not
        const canVote = await DReddit.methods.canVote(this.props.id).call();

        this.setState({
            title,
            image,
            canVote
        });
    }

    _vote = choice => async event => {
        event.preventDefault();
       
        this.props.updateVotes(1);

        this.setState({
            canVote: false,
            upvotes: this.state.upvotes + (choice == ballot.UPVOTE ? 1 : 0),
            downvotes: this.state.downvotes + (choice == ballot.DOWNVOTE ? 1 : 0)
        });

        this.setState({isSubmitting: false});
    }

    render(){
        const {title, image, upvotes, downvotes, isSubmitting, canVote} = this.state;
        const {classes, filterBy, votingEnabled} = this.props;
        const disabled = !votingEnabled || isSubmitting || !canVote;


        const score = upvotes - downvotes;
        const display = contains(filterBy, title);

        return display && <Card className={classes.card}>
            <CardHeader title={title} />
            <CardContent>
                <Grid container spacing={24}>
                    <Grid item xs={1}>
                        <IconButton className={classes.actions} disabled={disabled} onClick={this._vote(ballot.UPVOTE)}>
                            <UpvoteIcon />
                        </IconButton>
                        <Typography variant="display1" style={{textAlign: 'center', width: 48}}>{ score }</Typography>
                        <IconButton className={classes.actions} disabled={disabled} onClick={this._vote(ballot.DOWNVOTE)}>
                            <DownvoteIcon />
                        </IconButton>
                        { isSubmitting && <CircularProgress size={14} className={classes.spinner} /> }
                    </Grid>
                    <Grid item xs={11}>
                        <div className="tshirt">
                            <Image src={image} />
                        </div>
                    </Grid>
                </Grid>               
            </CardContent>
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
    description: PropTypes.string.isRequired,
    updateVotes: PropTypes.func.isRequired,
    votingEnabled: PropTypes.bool.isRequired
  };
  

export default withStyles(styles)(Post);
