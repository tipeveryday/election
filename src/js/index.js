import React from 'react'
import ReactDOM from 'react-dom'
import Web3 from 'aion-web3'
import casinoJSON from './../../build/contracts/Casino.json' // import our contract JSON
// import './../css/index.css' // styling

// Initializing Variables
let web3;
let aiwa;
let myContract;
// let contractAddress = "0xa05469cA61CB30f792C27809aC9C893f8271faFF166bBC1e994ea4Aa980D68b1"; old contract
// let contractAddress = "0xa00028a1d35C1b52858638bA30aF74C2A0067476D1Ce963B61359b1B43202DBC"
let contractAddress = "0xA0C3a25a1D96848a24f18A574E0583b2183Af7CE97c222d1b3b50ee00a072B7B"
let account = "Not Detected - Please download AIWA to play this game";
let account_sub = "";

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
        account_sub =  account.substring(2);
    } else {
      // NODESMITH fallback
      web3 = new Web3(new Web3.providers.HttpProvider("https://api.nodesmith.io/v1/aion/testnet/jsonrpc?apiKey=b07fca69798743afbfc1e88e56e9af9d"));

      // Initiate Contract at existing address
      myContract = new web3.eth.Contract(casinoJSON.info.abiDefinition, contractAddress);
      console.log('Contract Instantiated:', myContract);
      account_sub =  account.substring(2);
  }
}

// Main React App
class App extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            lastLuckyAnimal: "",
            numberOfBets: 0,
            minimumBet: 0,
            totalBet: 0,
            maxAmountOfBets: 0,
            accounts: account,
            doesPlayerExist: false,
        }
        window.a = this.state
        this.updateState = this.updateState.bind(this)
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
      // myContract.methods.lastLuckyFace().call({})
      myContract.methods.lastLuckyAnimal().call({})
      .then(function(result){
          console.log('Last Lucky Animal', result);
          let winner;

          switch(result) {
            case 1:
              winner = "Walrus";
              break;
            case 2:
              winner = "Donkey";
              break;
            case 3:
              winner = "Beaver";
              break;
            case 4:
              winner = "Duck";
              break;
            case 5:
              winner = "Chick";
              break;
            case 6:
              winner = "Cow";
              break;
            case 7:
              winner = "Dog";
              break;
            case 8:
              winner = "Monkey";
              break;
            case 9:
              winner = "Elephant";
              break;
            case 10:
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

      // console.log('address sub', account_sub);
      // Grab Aion Bet
      let voteCallObject;
      let debugObject;
      let signedBet;
      let bet = (this.refs['aion-bet'].value).toString();
      console.log('bet = ', bet);

      if (!bet) {
        // if no bet detected, set to 0 to fire alert
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
        // DIRECT HIT
        // debugObject = {
        //   // from: this.state.accounts,
        //   from: "0xa0035a4ed024e8b0d0c0af82efc3a03ef5baadbd11602461d0da39b0291235c3",
        //   to: contractAddress,
        //   gas: 2000000,
        //   value: web3.utils.toNAmp(bet),
        //   data: myContract.methods.bet(8).encodeABI()
        // }
        // web3.eth.accounts.signTransaction(
        //   debugObject, "f91658b2ca2db558861121df98ea3a74b3179853b1758c37ca0bd831f0391a2beb9669e03ce3c3d3b31e5bf7d09a288f1750c5078ea0eb9893ef1ec7bc52bf7e"
        // ).then(function(res){
        //   signedBet = res;
        //   console.log(signedBet);
        //   web3.eth.sendSignedTransaction(
        //     signedBet.rawTransaction
        //     ).on('transactionHash', txHash => {
        //       console.log("txHash", txHash) }
        //     ).on('receipt',
        //       receipt => { console.log("receipt", receipt) }
        //     );
        // });
      }
      // Alert user if bet is less than minimum
      if (parseFloat(bet) < this.state.minimumBet) {
          alert('You must bet more than the minimum')
          cb()
      } else {
        console.log("hit aiwa else");
        aiwa.eth.sendTransaction(
          voteCallObject
        ).then(function(receipt){
          console.log('receipt', receipt);
          if (window.confirm('Click "OK" to see transaction receipt.')) {
            // window.location.href='https://www.google.com/chrome/browser/index.html';
            window.open(
              'https://mastery.aion.network/#/transaction/'+receipt,
              '_blank' // <- This is what makes it open in a new window.
            );
          };
          cb()
        });

        // --------------------------
        // myContract.methods.bet(number).send({
        //   from: this.state.accounts,
        //   to: contractAddress,
        //   gas: 200000,
        //   value: web3.utils.toNAmp(bet),
        //   // web3.utils.toNAmp(2)
        // }).on('transactionHash', function(hash){
        //   console.log(hash);
        // }).on('receipt', function(receipt){
        //   // receipt example
        //   console.log(receipt);
        // })

        // ------------------------------
        // myContract.methods.bet(8).sendSigned({
        //   from: "a03824d966478a8eb43442edd577e78341cc1c6573835b31d0e3997a2553f8de",
        //   to: contractAddress,
        //   gas: 200000,
        //   value: web3.utils.toNAmp(2),
        // })
        // .then(function(receipt){
        //     // receipt can also be a new contract instance, when coming from a "contract.deploy({...}).send()"
        //     console.log(receipt);
        // });
        //--------------------------- AIWA IMPLEMENTATION CURRENTLY UNAVAILABLE
        // aiwa.eth.sendTransaction(
        //   voteCallObject
        // ).then(function(receipt){
        //   console.log('receipt', receipt);
        //   if (window.confirm('Click "OK" to see transaction receipt.')) {
        //     // window.location.href='https://www.google.com/chrome/browser/index.html';
        //     window.open(
        //       'https://mastery.aion.network/#/transaction/'+receipt,
        //       '_blank' // <- This is what makes it open in a new window.
        //     );
        //   };
        //   cb()
        // });
      }
    }

    render() {
        return (
            <div className="main-container">
              <h1>Welcome to Aion Roulette🚀</h1>
              <div className="rules">
                <div className="block ">
                    <b>Number of bets so far:</b> &nbsp;
                    <span>{this.state.numberOfBets}</span>
                </div>

                <div className="block">
                    <b>Last winning animal:</b> &nbsp;
                    <span>{this.state.lastLuckyAnimal}</span>
                </div>

                <div className="block">
                    <b>Total AION pool:</b> &nbsp;
                    <span>{this.state.totalBet} AION</span>
                </div>

                <div className="block">
                    <b>Minimum bet:</b> &nbsp;
                    <span>{this.state.minimumBet} AION</span>
                </div>

                <div className="block">
                    <b>Max amount of bets:</b> &nbsp;
                    <span>{this.state.maxAmountOfBets}</span>
                </div>
              </div>


              <hr />

              <h2>Vote who is going to be the face of Aion! <br/> When {this.state.maxAmountOfBets} bets have been placed - a new member of Aion will be randomly picked 👑 and a payout will occur. <br/> Winners who guessed correctly will split the amount in the AION pool!</h2>
              <hr />

              <h3>Vote</h3>
              <label>
                  <b>1. How much AION do you want to bet? <input className="bet-input" ref="aion-bet" type="number" placeholder="0"/> AION</b>
                  <br />
                  <b>2. Now pick a face!</b>
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
