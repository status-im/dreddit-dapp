import React, {Component, Fragment} from 'react';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import LinearProgress from '@material-ui/core/LinearProgress';
import PropTypes from 'prop-types';
import TextField from '@material-ui/core/TextField';
import {withStyles} from '@material-ui/core/styles';
import axios from 'axios';
import config from '../config';
import EmbarkJS from 'Embark/EmbarkJS';

const styles = theme => ({
  textField: {
    marginRight: theme.spacing.unit * 2
  }
});

class Create extends Component{

  constructor(props){
    super(props);
    
    this.state = {
      'title': '',
      'isSubmitting': false,
      'error': '',
      'fileToUpload': null,
      'uploadError': ''
    };
  }

  handleFileUpload(e){
    this.setState({fileToUpload: [e.target]});
  }

  handleClick = async event => {
    event.preventDefault();

    this.setState({'error': '', 'uploadError': ''});

    const errorState = {};
    if(this.state.title.trim() === ''){
      errorState.error = 'Required field';
    } 
    
    if(this.state.fileToUpload === null) {
      errorState.uploadError = 'Required field';
    }

    if(!(Object.keys(errorState).length === 0 && errorState.constructor === Object)){
      this.setState(errorState);
      return;
    }

    this.setState({
      isSubmitting: true 
    });

    const imageHash = await EmbarkJS.Storage.uploadFile(this.state.fileToUpload);

    // Create the picture in DB
    await axios.post(config.server + '/tshirt', {id: imageHash, title: this.state.title});

    document.getElementById("fileUpload").value = null;

    this.setState({
      isSubmitting: false,
      title: '',
      fileToUpload: null
    });

    this.props.afterPublish();
  }

  handleChange = name => event => {
    this.setState({
      [name]: event.target.value
    });
  };

  render(){
    const {classes} = this.props;
    const {error, title, isSubmitting, uploadError} = this.state;

    return (<Fragment>
      <Card>
        <CardContent>
          <TextField
            id="title"
            label="Title"
            error={error != ""}
            multiline
            rowsMax="20"
            fullWidth
            value={title}
            helperText={error}
            onChange={this.handleChange('title')}
            className={classes.textField}
            margin="normal" />
            
            <input
              accept="image/*"
              id="fileUpload"
              type="file"
              className={uploadError ? "fieldError" : ""}
              onChange={(e) => this.handleFileUpload(e)} />

            <span className="fieldError">{uploadError}</span>
            

          {
            <Button variant="contained" color="primary" onClick={this.handleClick} disabled={isSubmitting }>Publish</Button>
          }
        </CardContent>
      </Card>
      { this.state.isSubmitting && <LinearProgress /> }
      </Fragment>
    );
  }
}

Create.propTypes = {
  classes: PropTypes.object.isRequired,
  afterPublish: PropTypes.func.isRequired
};

export default withStyles(styles)(Create);
