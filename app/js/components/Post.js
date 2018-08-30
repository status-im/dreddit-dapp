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
import axios from 'axios';
import config from '../config';
import EmbarkJS from 'Embark/EmbarkJS';
import web3 from 'Embark/web3';

const styles = theme => ({
    actions: {
      marginRight: theme.spacing.unit * 5,
      fontSize: 15,
      display: 'flex'
    },
    card: {
      margin: theme.spacing.unit * 2,
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
            score: props.score,
            isSubmitting: false,
            canVote: true
        };
    }

    _vote = async (event, choice) => {
        event.preventDefault();

        choice = choice == ballot.UPVOTE ? 1 : -1;

        this.setState({isSubmitting: true});


        this.setState({
            canVote: false,
            score: this.state.score + choice
        });

        const ipfsHash = this.props.hash;
        await axios.post(config.server + '/vote', {id: ipfsHash, account: this.props.account, wallet: web3.eth.defaultAccount, selection: choice});

        this.props.updateVotes(this.props.id);

        this.setState({isSubmitting: false});
    }

    render(){
        const {isSubmitting, canVote, score} = this.state;
        const {classes, filterBy, votingEnabled, title, hash} = this.props;
        const disabled = !votingEnabled || isSubmitting || !canVote;
        const image = EmbarkJS.Storage.getUrl(hash);
        const display = contains(filterBy, title);

        return display && <Card className={classes.card}>
            <CardHeader title={title} />
            <CardContent>
                <Grid container spacing={24}>
                    <Grid item xs={2}>
                        <IconButton className={classes.actions} disabled={disabled} onClick={(event) => this._vote(event, ballot.UPVOTE)}>
                            <UpvoteIcon />
                        </IconButton>
                        <Typography variant="display1" style={{textAlign: 'center', width: 48}}>{ score }</Typography>
                        <IconButton className={classes.actions} disabled={disabled} onClick={(event) => this._vote(event, ballot.DOWNVOTE)}>
                            <DownvoteIcon />
                        </IconButton>
                        { isSubmitting && <CircularProgress size={14} className={classes.spinner} /> }
                    </Grid>
                    <Grid item xs={10}>
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
    account: PropTypes.string,
    score: PropTypes.number,
    classes: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    hash: PropTypes.string.isRequired,
    updateVotes: PropTypes.func.isRequired,
    votingEnabled: PropTypes.bool.isRequired
  };
  

export default withStyles(styles)(Post);
