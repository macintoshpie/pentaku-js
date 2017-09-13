# Pentaku JS
This is a small game I made to learn some basic javascript and HTML canvas. I intentionally chose to create it using only vanilla javascript in order to master the fundamentals. Its called Pentaku because [Pentago](https://en.wikipedia.org/wiki/Pentago) and [Gomoku](https://en.wikipedia.org/wiki/Gomoku) are two of the games you can play with this app.

## [Demo here]()

### The basics:
1.Place player piece on empty space of board
2. (Optional, if rotation enabled) Choose a quadrant and rotate it 90 degrees clockwise or couterclockwise
3. Win by getting enough of your player pieces in a horizontal, vertical, or diagonal line  

The app includes a GUI that allows the user edit parameters of the game:

| rotate radius  | if zero, no rotation is used in the game. Otherwise, this determines the size of the rotation grids |
| columns  | number of columns and rows (allows only values compatible with the rotate radius parameter)  |
| winning length  | number of player pieces in a row required to win the game  |
| players  | number of players  |
| player name, type, color  | attributes of the player. Ok bot is an ok bot, random bot is random...  |