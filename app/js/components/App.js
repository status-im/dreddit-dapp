import React, {Component, Fragment} from 'react';
import Create from './Create';
import Header from './Header';
import Post from './Post';
import _ from 'lodash';
import axios from 'axios';
import config from '../config';
import EmbarkJS from 'Embark/EmbarkJS';
import DReddit from 'Embark/contracts/DReddit';
import web3 from 'Embark/web3';
class App extends Component {

  constructor(props) {
    super(props);

    this.state = {
      'displayForm': false,
      'list': [],
      'sortBy': 'age',
      'sortOrder': 'desc',
      'filterBy': '',
      'votes': 0,
      'canVote': true
    };
  }

  componentDidMount() {
    EmbarkJS.onReady(() => {


      axios.get(config.server + '/votes/' + web3.eth.defaultAccount)
      .then(response => {
        if(response.data.success){
          const votes = response.data.votes;
          this.setState({
            votes,
            canVote: votes.length < 3
          });
        }
      });
  
      this._loadPosts();
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

  _loadPosts = async () => {
    const {posts, numPosts} = DReddit.methods;

    let list = [];

    const total = await numPosts().call();
    if(total > 0){
        for (let i = 0; i < total; i++) {
            const currentPost = posts(i).call();
            list.push(currentPost);
        }

        list = await Promise.all(list);
        list = list.map((value, index) => { 
                      value.id = index; 
                      value.hash = web3.utils.toAscii(value.description);
                      return value; 
        });

        let scores = [];
        for(let i = 0; i < total; i++){
          const desc = web3.utils.toAscii(list[i].description);
          try {
            const currScore = await axios.get(config.server + '/score/' + desc);
            scores.push(currScore);
          } catch (err){
            console.log("Couldn't load score for shirt: " + desc);
          }
        }

        for(let i = 0; i < total; i++){
          if(scores[i].data && scores[i].data.success) {
            list[i].score = scores[i].data.score;
          } else {
            list[i].score = 0;
          }
        }   
      }

    this.setState({list});
  }

  _search = (filterBy) => {
    this.setState({filterBy});
  }

  render() {
    const {displayForm, list, sortBy, sortOrder, filterBy, canVote, votes} = this.state;

    let orderedList;
    if(sortBy == 'rating'){
      orderedList = _.orderBy(list, [function(o) { return o.score; }, 'creationDate'], [sortOrder, sortOrder]);
    } else if(sortBy == 'age') {
      orderedList = _.orderBy(list, 'creationDate', sortOrder);
    } else {
      orderedList = _.shuffle(list);
    }

    return (<Fragment>
        <Header toggleForm={this._toggleForm} sortOrder={this._setSortOrder} search={this._search} />
        { displayForm && <Create afterPublish={this._loadPosts} /> }
        { orderedList.map((record) => <Post key={record.id} {...record} filterBy={filterBy} updateVotes={this._updateVotes} votingEnabled={!votes.includes(record.hash) && canVote} />) }
        </Fragment>
    );
  }
}

export default App;
