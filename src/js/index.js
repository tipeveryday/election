import React from 'react'
import ReactDOM from 'react-dom'
import Web3 from 'aion-web3'
import casinoJSON from './../../build/contracts/Casino.json' // import our contract JSON

// Initializing Variables
let web3;
let aiwa;
let myContract;
let contractAddress = "0xA09A51675aF1792DDa3eF5604A69821BcDff01f1Dc233e67f136F848c8fa753F"
let account = "Not Detected - Please download AIWA to play this game";

// Detect AIWA injection and inject into application
function injectWeb3() {
  // Is there an injected web3 instance?
  if (window.aionweb3) { // AIWA Chrome extension will inject automatically
      console.log("✓ AIWA injected successfully");
      web3 = new Web3(window.aionweb3.currentProvider);
      aiwa = window.aionweb3;

      // Initiate Contract at existing address
      myContract = new web3.eth.Contract(casinoJSON.info.abiDefinition, contractAddress);
      console.log('Contract Instantiated:', myContract);
  } else {
    // NODESMITH fallback
    web3 = new Web3(new Web3.providers.HttpProvider("https://api.nodesmith.io/v1/aion/testnet/jsonrpc?apiKey=b07fca69798743afbfc1e88e56e9af9d"));

    // Initiate Contract at existing address
    myContract = new web3.eth.Contract(casinoJSON.info.abiDefinition, contractAddress);
    console.log('Contract Instantiated:', myContract);
  }
}

// Main React App
class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      lastLuckyAnimal: "",
      numberOfBets: -1,
      minimumBet: 0,
      maximumBet: 0,
      totalBet: 0,
      maxAmountOfBets: 0,
      accounts: account,
      doesPlayerExist: false,
    }
    window.a = this.state
    this.updateState = this.updateState.bind(this)
    // this.distributePrizes = this.distributePrizes.bind(this)
  }

  componentDidMount() {
    console.log('componentDidMount');
    // Check for AIWA after mount
    setTimeout(function () {
        console.log(window.aionweb3);
        injectWeb3();
        this.updateState()
        this.setupListeners()
    }.bind(this), 3000);

    // poll contract info
    setInterval(this.updateState.bind(this), 7e3)
    // this.distributePrizes();
  }
  // Update DOM from Contract information
  updateState() {
    console.log('updateState hit');

    // update active account
    this.setState({
      accounts: aiwa.eth.accounts.toString(),
    })

    // check if account has already placed a bet
    myContract.methods.checkPlayerExists(aiwa.eth.accounts.toString()).call({})
    .then(function(result){
      console.log(result);
      this.setState({
        doesPlayerExist: result
      })
    }.bind(this));

    // update mininum bet value
    myContract.methods.minimumBet().call({})
    .then(function(result){
        console.log('min bet', result);
        this.setState({
          minimumBet: result
        })
    }.bind(this));

    // update mininum bet value
    myContract.methods.maximumBet().call({})
    .then(function(result){
        console.log('min bet', result);
        this.setState({
          maximumBet: result
        })
    }.bind(this));

    // update total amount in bets
    myContract.methods.totalBet().call({})
    .then(function(result){
        console.log('total bet', result);
        // Do the Division for 18 decimal points (AION)
        this.setState({
          totalBet: (result / 1*Math.pow(10,-18))
        })
    }.bind(this));

    // update numberOfBets
    myContract.methods.numberOfBets().call({})
    .then(function(result){
        console.log('number of bets', result);
        this.setState({
          numberOfBets: result
        })
    }.bind(this));

    // update maximum amount of bets
    myContract.methods.maxAmountOfBets().call({})
    .then(function(result){
        console.log('maxAmountOfBets', result);
        this.setState({
          maxAmountOfBets: result
        })
    }.bind(this));

    // update last winner
    myContract.methods.lastLuckyAnimal().call({})
    .then(function(result){
      console.log('Last Lucky Animal', result);
      console.log(result);
      let winner;

      switch(result) {
        case '1':
          winner = "Walrus";
          break;
        case '2':
          winner = "Donkey";
          break;
        case '3':
          winner = "Beaver";
          break;
        case '4':
          winner = "Duck";
          break;
        case '5':
          winner = "Chick";
          break;
        case '6':
          winner = "Cow";
          break;
        case '7':
          winner = "Dog";
          break;
        case '8':
          winner = "Monkey";
          break;
        case '9':
          winner = "Elephant";
          break;
        case '10':
          winner = "Lion";
          break;
        default:
          winner = "N/A"
      }

      this.setState({
        lastLuckyAnimal: winner
      })
    }.bind(this));
  }

    // Listen for events and executes the voteNumber method
    setupListeners() {
      console.log('setupListeners hit');
      let liNodes = this.refs.numbers.querySelectorAll('li')
      // let imgNodes = this.refs.numbers.querySelectorAll('img')
      liNodes.forEach(number => {
          number.addEventListener('click', event => {
              // If player exists, do not allow voting
              if (this.state.doesPlayerExist) {
                alert("This account has already placed a bet. Wait until next round!")
              } else {
                event.target.className = 'number-selected'
                console.log('number selected', event.target.value);
                this.voteNumber(event.target.value, done => {
                  // Remove the other number selected
                  for (let i = 0; i < liNodes.length; i++) {
                    liNodes[i].className = ''
                  }
                })
              }
          })
      })
    }

    // Send Number to Contract
    voteNumber(number, cb) {
      // Grab Aion Bet
      let voteCallObject;
      let debugObject;
      let signedBet;
      let bet = (this.refs['aion-bet'].value).toString();
      console.log('bet = ', bet);

      if (!bet) {
        // If no bet detected, set to 0 to fire alert
        bet = 0
        // Alert user if bet is less than minimum
        if (parseFloat(bet) < this.state.minimumBet) {
            alert('You must bet more than the minimum')
            cb()
        }
      } else {
        console.log("hit the !bet else");
        // Create TX Object - works w/ AIWA
        voteCallObject = {
          from: this.state.accounts,
          to: contractAddress,
          gas: 2000000,
          value: web3.utils.toNAmp(bet),
          data: myContract.methods.bet(number).encodeABI()
        }
      }


      // Alert user if bet is less than minimum
      if (parseFloat(bet) < this.state.minimumBet) {
          alert('You must bet more than the minimum')
          cb()
      } else {
        console.log("hit aiwa else");
        aiwa.eth.sendTransaction(
          voteCallObject
        ).then(function(txHash){
          console.log('txHash', txHash);
          if (window.confirm('Click "OK" to see transaction hash.')) {
            // window.location.href='https://www.google.com/chrome/browser/index.html';
            window.open(
              'https://mastery.aion.network/#/transaction/'+ txHash,
              '_blank' // <- This is what makes it open in a new window.
            );
          };
          cb()
          // setTimeout(function(){
          //   this.distributePrizes()
          // }.bind(this), 40000)
        });
      }
    }

    // distributePrizes() {
    //   console.log('distributing prizes');
    //   if (this.state.numberOfBets >= this.state.maxAmountOfBets) {
    //     // update total amount in bets
    //     let distributePrizeObject = {
    //       from: "0xa0035a4ed024e8b0d0c0af82efc3a03ef5baadbd11602461d0da39b0291235c3",
    //       to: contractAddress,
    //       gas: 2000000,
    //       data: myContract.methods.distributePrizes().encodeABI()
    //     }
    //
    //     // Sign transactionHash
    //     web3.eth.accounts.signTransaction(
    //       distributePrizeObject, "68b5b79267b9f4df429540489c81517f2f9a4bced5550969fd3d9c4d9822afa437423faaab8d4a1ba0e5377d1500b566eb63175a223b3190550cab5108be367a"
    //     ).then(function(result){
    //       web3.eth.sendSignedTransaction(
    //       result.rawTransaction
    //       ).on('transactionHash', txHash => {
    //         console.log("txHash", txHash)
    //       }).on('receipt',
    //         receipt => { console.log("receipt", receipt) }
    //       );
    //     })
    //   } else {
    //     console.log('distributePrizes - conditions not met')
    //   }
    // }
    render() {
      const overlay = () => {
        if (this.state.numberOfBets >= this.state.maxAmountOfBets) {
          return (
            <div className="overlay">
              <p>End of game. Next round starting shortly.</p>
            </div>
          )
        }
      }
      return (
          <div className="main-container">
          {overlay()}
            <h1>Welcome to Aion Roulette🚀</h1>
            <div className="rules">
              <div className="block ">
                  <b>Number of Bets:</b> &nbsp;
                  <span>{this.state.numberOfBets}</span>
                  /
                  <span>{this.state.maxAmountOfBets}</span>
              </div>

              <div className="block">
                  <b>Last Winning Animal:</b> &nbsp;
                  <span>{this.state.lastLuckyAnimal}</span>
              </div>

              <div className="block">
                  <b>Total AION pool:</b> &nbsp;
                  <span>{this.state.totalBet} AION</span>
              </div>

              <div className="block">
                <b>Min Bet:</b> &nbsp;
                <span>{this.state.minimumBet} AION</span>
              </div>

              <div className="block">
                <b>Max Bet:</b> &nbsp;
                <span>{this.state.maximumBet} AION</span>
              </div>

            </div>


            <hr />

            <h2>Vote which animal will be randomly selected! <br/> When {this.state.maxAmountOfBets} bets have been placed - an animal will be randomly selected and a payout will occur. <br/> Winners who guessed correctly will split the amount in the AION pool!</h2>
            <hr />

            <h3>Let's play!</h3>
            <label>
                <b>1. How much AION do you want to bet? <input className="bet-input" ref="aion-bet" type="number" placeholder="0"/> AION</b>
                <br />
                <b>2. Now pick an animal!</b>
            </label>
            <ul ref="numbers" className="numbers">
                <li value="1"></li>
                <li value="2"></li>
                <li value="3"></li>
                <li value="4"></li>
                <li value="5"></li>
                <li value="6"></li>
                <li value="7"></li>
                <li value="8"></li>
                <li value="9"></li>
                <li value="10"></li>
            </ul>

            <hr />
            <div className="footer">
              <div><i>Only working with the Mastery Test Network 📡</i></div>
              <div><i>You can only vote once per account</i></div>
              <div><i>Your account is <strong>{this.state.accounts}</strong></i></div>
              <div><i>Your vote will be reflected when the next block is mined.</i></div>
              <div className="link"><i>Don't have AIWA? <a href="https://learn.aion.network/v1.0/docs/aiwa" target="_blank">Start here</a></i></div>
            </div>

            <div className="madeWithLove">
              <p>Made with 🔥 by the Aion Developer Success Team 🤘</p>
            </div>
        </div>
      )
    }
}

ReactDOM.render(
    <App />,
    document.querySelector('#root')
)
