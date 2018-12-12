pragma solidity 0.4.15;
contract Casino {
   address public owner;
   uint public minimumBet;
   uint public totalBet;
   uint public numberOfBets;
   uint public maxAmountOfBets = 100;
   address[] public players;
   struct Player {
      uint amountBet;
      uint numberSelected;
   }
   // The address of the player and => the user info
   mapping(address => Player) public playerInfo;
   function() public payable {}
   function Casino(uint _minimumBet) public {
      owner = msg.sender;
      if(_minimumBet != 0 ) minimumBet = _minimumBet;
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
   // To bet for a number between 1 and 10 both inclusive
   function bet(uint numberSelected) public payable {
      require(!checkPlayerExists(msg.sender));
      require(numberSelected >= 1 && numberSelected <= 10);
      require(msg.value >= minimumBet);
      playerInfo[msg.sender].amountBet = msg.value;
      playerInfo[msg.sender].numberSelected = numberSelected;
      numberOfBets++;
      players.push(msg.sender);
      totalBet += msg.value;
   }
   // Generates a number between 1 and 10 that will be the winner
   function generateNumberWinner() public {
      uint numberGenerated = block.number % 10 + 1; // This isn't secure
      distributePrizes(numberGenerated);
   }
   // Sends the corresponding ether to each winner depending on the total bets
   function distributePrizes(uint numberWinner) public {
      address[100] memory winners; // We have to create a temporary in memory array with fixed size
      uint count = 0; // This is the count for the array of winners
      for(uint i = 0; i < players.length; i++){
         address playerAddress = players[i];
         if(playerInfo[playerAddress].numberSelected == numberWinner){
            winners[count] = playerAddress;
            count++;
         }
         delete playerInfo[playerAddress]; // Delete all the players
      }
      players.length = 0; // Delete all the players array
      uint winnerEtherAmount = totalBet / winners.length; // How much each winner gets
      for(uint j = 0; j < count; j++){
         if(winners[j] != address(0)) // Check that the address in this fixed array is not empty
         winners[j].transfer(winnerEtherAmount);
      }
   }
}
