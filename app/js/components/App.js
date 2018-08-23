import React, {Component, Fragment} from 'react';
import Create from './Create';
import Header from './Header';
import Post from './Post';
import _ from 'lodash';
import axios from 'axios';
import config from '../config';
import EmbarkJS from 'Embark/EmbarkJS';
import web3 from 'Embark/web3';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import {withStyles} from '@material-ui/core/styles';

const styles = theme => ({
fab: {
  position: 'fixed',
  bottom: theme.spacing.unit * 3,
  right: theme.spacing.unit * 3
}
});

class App extends Component {

  constructor(props) {
    super(props);

    this.state = {
      'displayForm': false,
      'list': [],
      'sortBy': 'age',
      'sortOrder': 'desc',
      'filterBy': '',
      'votes': [],
      'canVote': false,
      'account': null,
      'isManager': false
    };
  }

  componentDidMount() {
    EmbarkJS.onReady(() => {  
      window.addEventListener('message', (event) => {
        if (!event.data || !event.data.type) { return; }
        if (event.data.type === 'STATUS_API_SUCCESS') {
            this.setState({account: STATUS_API["CONTACT_CODE"]});
            this._loadVotes();
            this._isManager();
        }
      });

      // request status API
      setTimeout(
        () => { 
          window.postMessage({type: 'STATUS_API_REQUEST', permissions: ["CONTACT_CODE"]}, '*'); 
        }, 500
      );
      
      // If not using api, use web3
      //this.setState({account: web3.eth.defaultAccount});
      this._isManager();
      this._loadPosts();
      this._loadVotes();
  });
  }

  _toggleForm = () => {
    this.setState({displayForm: !this.state.displayForm});
  }

  _updateVotes = (vote) => {
    let votes = this.state.votes;
    votes.push(vote);

    localStorage.setItem('votes', JSON.stringify(votes));

    this.setState({
      votes,
      canVote: votes.length < 3
    });
  }

  _setSortOrder = (sortBy) => {
    const sortOrder = (this.state.sortOrder == 'asc' && this.state.sortBy == sortBy) || this.state.sortBy != sortBy ? 'desc' : 'asc';
    this.setState({sortBy, sortOrder});
  }

  _loadVotes = async () => {
    if(!this.state.account) return;

    const response = await axios.get(config.server + '/votes/' + this.state.account);
    if(response.data.success){
      const votes = response.data.votes;
      this.setState({
        votes,
        canVote: votes.length < 3
      });
    }
  }

  _isManager = async () => {
    if(!this.state.account) return;

    const response = await axios.get(config.server + '/isManager/' + this.state.account);
    if(response.data.result){
      this.setState({
        isManager: true
      });
    }
  }

  _loadPosts = async () => {
    let list = [];

    const response = await axios.get(config.server + '/tshirts/');
    if(response.data.success){
      list = response.data.votes
              .map((value) => { 
                value.hash = value.id; // TODO: change id on db to hash.
                value.id = value._id; 
              return value; 
              });
    }

    this.setState({list});
  }

  _search = (filterBy) => {
    this.setState({filterBy});
  }

  render() {
    const {displayForm, list, sortBy, sortOrder, filterBy, canVote, votes, account, isManager} = this.state;
    const {classes} = this.props;

    let orderedList;
    if(sortBy == 'rating'){
      orderedList = _.orderBy(list, [function(o) { return o.score; }, 'creationDate'], [sortOrder, sortOrder]);
    } else if(sortBy == 'age') {
      orderedList = _.orderBy(list, 'creationDate', sortOrder);
    } else {
      orderedList = _.shuffle(list);
    }

    return (<Fragment>
        <Header toggleForm={this._toggleForm} sortOrder={this._setSortOrder} search={this._search} isManager={isManager} />
        { displayForm && <Create account={account} afterPublish={this._loadPosts} /> }
        { !account && <SnackbarContent message="This DApp requires CONTACT_CODE permission from the Status app to enable voting" /> }
        { orderedList.length == 0 && <Typography variant="display1" style={{marginTop: 40, textAlign: 'center'}}>
          Loading items... <CircularProgress />
        </Typography> }
        { orderedList.map((record) => <Post account={account} key={record.id} {...record} filterBy={filterBy} updateVotes={this._updateVotes} votingEnabled={account !== null && !votes.includes(record.hash) && canVote} />) }
        <Button variant="contained" color="secondary" disabled={!canVote || account === null || votes.length >= 3} className={classes.fab}>
        {!canVote || account === null ? 0 : (3 - votes.length)} vote(s) available
        </Button>
        </Fragment>
    );
  }
}

App.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(App);
