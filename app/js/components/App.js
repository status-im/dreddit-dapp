import React, {Component, Fragment} from 'react';
import Create from './Create';
import Header from './Header';
import Post from './Post';
import _ from 'lodash';

import EmbarkJS from 'Embark/EmbarkJS';
import DReddit from 'Embark/contracts/DReddit';

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
    const storedVotes = localStorage.getItem('votes');
    const votes = !storedVotes || isNaN(storedVotes) ? 0 : parseInt(localStorage.getItem('votes'), 10);
    this.setState({
      votes,
      canVote: votes < 3
    });

    // Invoke `this._loadPosts()` as soon as Embark is ready
    EmbarkJS.onReady(() => {
      this._loadPosts();
  });
  }

  _toggleForm = () => {
    this.setState({displayForm: !this.state.displayForm});
  }

  _updateVotes = (vote) => {
    let votes = this.state.votes;
    votes += vote;

    localStorage.setItem('votes', votes);
    this.setState({
      votes,
      canVote: votes < 3
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
                      value.upvotes = parseInt(value.upvotes, 10);
                      value.downvotes = parseInt(value.downvotes, 10);
                      return value; 
                    });
    }
    
    this.setState({list});
  }

  _search = (filterBy) => {
    this.setState({filterBy});
  }

  render() {
    const {displayForm, list, sortBy, sortOrder, filterBy, canVote} = this.state;

    let orderedList;
    if(sortBy == 'rating'){
      orderedList = _.orderBy(list, [function(o) { return o.upvotes - o.downvotes; }, 'creationDate'], [sortOrder, sortOrder]);
    } else {
      orderedList = _.orderBy(list, 'creationDate', sortOrder);
    }

    return (<Fragment>
        <Header toggleForm={this._toggleForm} sortOrder={this._setSortOrder} search={this._search} />
        { displayForm && <Create afterPublish={this._loadPosts} /> }
        { orderedList.map((record) => <Post key={record.id} {...record} filterBy={filterBy} updateVotes={this._updateVotes} votingEnabled={canVote} />) }
        </Fragment>
    );
  }
}

export default App;
