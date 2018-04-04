import React, { Component } from 'react';
import 'reset-css/reset.css';
import queryString from 'query-string';


let defaultStyle = {
  color: "#42c673"
};
let counterStyle = {
    ...defaultStyle,
    display: 'inline-block',
    width: "33%",
    'margin-bottom': '20px',
    'font-size': '20px',
    'line-height': '30px',
    'font-family': 'Quicksand',
    'text-align': 'center'
}

function isEven(num) {
    return num % 2
}

class PlaylistCounter extends Component {
  render() {
      let playlistCounterStyle = counterStyle
    return (
      <div style={playlistCounterStyle}>
        <h2>{this.props.playlists.length} playlists</h2>
      </div>
    );
  }
}

class HoursCounter extends Component {
  render() {
    let allSongs = this.props.playlists.reduce((songs, eachPlaylist) => {
      return songs.concat(eachPlaylist.songs)
    }, [])
    let totalDuration = allSongs.reduce((sum, eachSong) => {
      return sum + eachSong.duration
    }, 0)
    let totalDurationHours = Math.round(totalDuration/60)
    let isTooLow = totalDurationHours < 10
    let hoursCounterStyle = {
        ...counterStyle,
        color: isTooLow ? 'red' : '#42c673',
        'font-weight': isTooLow ? 'bold' : 'normal'
    }
    return (
      <div style={hoursCounterStyle}>
        <h2>{totalDurationHours} hours</h2>
      </div>
    );
  }
}

class Filter extends Component {
  render() {
    return (
      <div style={defaultStyle}>
        <img/>
        <input type="text" placeholder={"search songs"} onKeyUp={event =>
          this.props.onTextChange(event.target.value)}
          style={{
              ...defaultStyle,
              color: 'black',
              border: '1px solid black',
              'font-size': '12px',
              padding: '5px',
              'text-align': 'center',
              'font-family': 'Quicksand'
          }}
        />
      </div>
    );
  }
}

class Playlist extends Component {
  render() {
    let playlist = this.props.playlist
    return (
      <div style={{
          ...defaultStyle,
          display: 'inline-block',
          width: "25%",
          padding: '10px'
          // background: isEven(this.props.index)
          //   ? '#C0C0C0'
          //   : '#808080'
      }}>
        <h3 style={{'margin-bottom': '10px','margin-top': '10px', 'font-size': '20px', 'font-weight': 'bold', 'font-family': 'Quicksand' }}>{playlist.name}</h3>
        <img src={playlist.imageUrl} style={{width: '100px', 'border-radius': '50%'}}/>
        <ul style={{'margin-top': '10px'}}>
          {playlist.songs.map(song =>
            <li style={{'padding-top': '2px', 'font-family': 'Quicksand'}}>{song.name}</li>
          )}
        </ul>
      </div>
    );
  }
}

class App extends Component {
  constructor() {
    super();
    this.state = {
      serverData: {},
      filterString: ''
    }
  }
  componentDidMount() {
    let parsed = queryString.parse(window.location.search);
    let accessToken = parsed.access_token;
    if (!accessToken)
      return;
    fetch('https://api.spotify.com/v1/me', {
      headers: {'Authorization': 'Bearer ' + accessToken}
    }).then(response => response.json())
    .then(data => this.setState({
      user: {
        name: data.display_name
      }
    }))

    fetch('https://api.spotify.com/v1/me/playlists', {
      headers: {'Authorization': 'Bearer ' + accessToken}
    }).then(response => response.json())
    .then(playlistData => {
      let playlists = playlistData.items
      let trackDataPromises = playlists.map(playlist => {
        let responsePromise = fetch(playlist.tracks.href, {
          headers: {'Authorization': 'Bearer ' + accessToken}
        })
        let trackDataPromise = responsePromise
          .then(response => response.json())
        return trackDataPromise
      })
      let allTracksDataPromises =
        Promise.all(trackDataPromises)
      let playlistsPromise = allTracksDataPromises.then(trackDatas => {
        trackDatas.forEach((trackData, i) => {
          playlists[i].trackDatas = trackData.items
            .map(item => item.track)
            .map(trackData => ({
              name: trackData.name,
              duration: trackData.duration_ms / 1000
            }))
        })
        return playlists
      })
      return playlistsPromise
    })
    .then(playlists => this.setState({
      playlists: playlists.map(item => {
          if (item.images.length > 0) { //HERE IM TESTING IF THE PLAYLIST HAS AN IMAGE
              return {
                name: item.name,
                imageUrl: item.images[0].url,
                songs: item.trackDatas.slice(0,2)
            } }
              return {
              name: item.name,
              imageUrl: "public/favicon.ico", // THE IMAGE IS NOT BEING DELIVERED BECAUSE IS NOT ASSOCIATED WITH THE USER
              songs: item.trackDatas.slice(0,2)
          }
    })
    }))

  }
  render() {
    let playlistToRender =
      this.state.user &&
      this.state.playlists
        ? this.state.playlists.filter(playlist => {
          let matchesPlaylist = playlist.name.toLowerCase().includes(
            this.state.filterString.toLowerCase())
          let matchesSong = playlist.songs.find(song => song.name.toLowerCase()
            .includes(this.state.filterString.toLowerCase()))
          return matchesPlaylist || matchesSong
        }) : []
    return (
      <div className="App">
        {this.state.user ?
        <div>
          <h1 style={{...defaultStyle,
              'font-size': '54px',
              'margin-top': '25px',
              'margin-bottom': '10px',
              'font-family': 'Quicksand'
          }}>

            {this.state.user.name}'s Playlists
          </h1>
          <PlaylistCounter playlists={playlistToRender}/>
          <HoursCounter playlists={playlistToRender}/>
          <Filter onTextChange={text => {
              this.setState({filterString: text})
            }}/>
          {playlistToRender.map((playlist, i) =>
            <Playlist playlist={playlist} index={i} />
          )}
        </div> : <button onClick={() => {
            window.location = window.location.href.includes('localhost')
              ? 'http://localhost:8888/login'
              : 'https://better-playlist-backend-riki.herokuapp.com/login' }
          }
          style={{...defaultStyle,
              padding: '10px',
              'font-size': '30px',
              'margin-top': '20px',
              'font-family': 'Quicksand',
              'border': '1px solid black'
          }}>Sign in</button>
        }
      </div>
    );
  }
}

export default App;
