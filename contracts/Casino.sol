pragma solidity ^0.4.15;

contract Casino {
  address owner;
  uint public minimumBet = 1;
  uint public maximumBet = 50;
  uint public numberOfBets;
  uint public maxAmountOfBets = 7;
  uint public totalBet;
  uint public lastLuckyAnimal;
  address[] public players;

  struct Player {
    uint amountBet;
    uint numberSelected;
  }
  mapping(address => Player) public playerInfo;

  event AnimalChosen(uint value);
  event WinnerTransfer(address to, uint value);

  modifier onEndGame(){
    if(numberOfBets >= maxAmountOfBets) _;
  }

  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }

  function Casino(){
    owner = msg.sender;
  }

  function() public payable {}

  function refund() public onlyOwner {
    uint totalBalance = this.balance;
    owner.transfer(totalBalance);
  }

  function kill() public {
    if(msg.sender == owner) selfdestruct(owner);
   }

  function checkPlayerExists(address player) public constant returns(bool){
    for(uint i = 0; i < players.length; i++){
       if(players[i] == player) return true;
    }
    return false;
  }

  function bet(uint numberSelected) payable {
    require(numberOfBets <= maxAmountOfBets);
    require(numberSelected >= 1 && numberSelected <= 10);
    require(checkPlayerExists(msg.sender) == false);
    require(msg.value >= minimumBet);

    playerInfo[msg.sender].amountBet = msg.value;
    playerInfo[msg.sender].numberSelected = numberSelected;
    numberOfBets++;

    players.push(msg.sender);
    totalBet += msg.value;

    if(numberOfBets >= maxAmountOfBets) generateNumberWinner();
  }

  function generateNumberWinner() private onEndGame {
    uint numberGenerated = block.number % 10 + 1;
    lastLuckyAnimal = numberGenerated;
    distributePrizes();

    AnimalChosen(lastLuckyAnimal);
  }

  function distributePrizes() private onEndGame {
    address[100] memory winners;
    uint count = 0;

    for(uint i = 0; i < players.length; i++){
       address playerAddress = players[i];
       if(playerInfo[playerAddress].numberSelected == lastLuckyAnimal){
          winners[count] = playerAddress;
          count++;
       }
       delete playerInfo[playerAddress];
    }
    players.length = 0;

    if (count > 0){
      uint winnerAIONAmount = totalBet / count;
      for(uint j = 0; j < count; j++){
        if(winners[j] != address(0))
        WinnerTransfer(winners[j], winnerAIONAmount);
        winners[j].transfer(winnerAIONAmount);
        totalBet = totalBet - winnerAIONAmount;
      }
    }

    numberOfBets = 0;
  }
}
