const darkSoldierImg = "/Images/Checkers_Dark_Piece.png";
const darkQueenImg = "/Images/Checkers_Dark_Piece_Queen.png";
const lightSoldierImg = "/Images/Checkers_Light_Piece.png";
const lightQueenImg = "/Images/Checkers_Light_Piece_Queen.png";
const game={};

initHTMLBoardGraphics();
initEventDetector();
initGameData();
printPiecesToBoard();
//Init Functions
function initHTMLBoardGraphics()
{
    const gameBoard = document.getElementById('tiles-container');
    for(let i=0;i<8;i++)
        for(let j=0;j<8;j++)
        {
            let tile = document.createElement('div');
            tile.className = ((i+j)%2==0?"light":"dark") + " tile";
            tile.id=""+i+j;
            tile.addEventListener('mouseover',()=>{
                if(tile.children[0]!==undefined&&tile.children[0].id === (game.playerIsDark?"dark":"light"))
                    tile.classList.add("blue");
            })
            tile.addEventListener('mouseout',()=>{
                tile.classList.remove("blue");
            })
            gameBoard.appendChild(tile);
        }
}
function initEventDetector()
{
    let boardClickDetector = document.getElementById("tiles-container");
    boardClickDetector.addEventListener('click',(e)=>{
        if(e.target.classList.contains("dark"))
        {
            handleUserClick(parseInt(e.target.id[0]),parseInt(e.target.id[1]));
        }
    })
}
function initGameData()
{
    game.playerIsDark = true;
    game.pickedPiece = {piece:undefined,i:undefined,j:undefined}
    game.darkPieces = 12;
    game.lightPieces = 12;
    game.board = initGameBoard();
    game.piecesCanEat = [];
    game.chainEating = false;
    return game;
}
function initGameBoard()
{
    let pieces = []
    for(let i=0;i<8;i++)
    {  
        pieces[i] = [];
        for(let j=0;j<8;j++)
        {
            if(i<3 && (j+i)%2==1)
                pieces[i].push(getSoldier(false));
            else if(i>4 && (j+i)%2==1)
                pieces[i].push(getSoldier(true));
            else pieces[i].push(getEmptyTile());            
        }
    }
    return pieces;
}

//Graphic HTML Interaction Functions
function refreshScreen()
{
    clearPiecesFromBoard();
    printPiecesToBoard();
}
function printPiecesToBoard()
{
    let tiles = document.getElementById("tiles-container")
    for(let i=0;i<8;i++)
        for(let j=0;j<8;j++)
        {
            if(game.board[i][j].type!=="empty")
            {
                let img=document.createElement('img');
                if((game.board[i][j]).type==="soldier")                
                    img.src = game.board[i][j].isDark?darkSoldierImg:lightSoldierImg;
                if(game.board[i][j].type==="queen") 
                    img.src = game.board[i][j].isDark?darkQueenImg:lightQueenImg;
                img.id = game.board[i][j].isDark?"dark":"light";             
                tiles.children[i*8+j].appendChild(img);
                if(game.board[i][j].picked==true) tiles.children[i*8+j].classList.add("picked");
                else tiles.children[i*8+j].classList.remove("picked")
                tiles.children[i*8+j].classList.remove("target");
            
            }
            else
            {
                if(game.board[i][j].isValidTarget) tiles.children[i*8+j].classList.add("target");
                else tiles.children[i*8+j].classList.remove("target");
                tiles.children[i*8+j].classList.remove("picked")
            }
        }
}
function clearPiecesFromBoard()
{
    let board= document.getElementById("tiles-container").children;
    for(let tile of board)
    {
        tile.innerHTML="";
    }    
}

//General Game Functions
function handleUserClick(i,j)
{
    //Click on valid soldier
    if(game.board[i][j].type==="soldier" && game.board[i][j].isDark === game.playerIsDark && !game.chainEating)
    {
        if(game.pickedPiece.piece !== undefined)
        {
            game.pickedPiece.piece.picked = false;
            UnsetTrgets();
        }
        game.pickedPiece.piece = game.board[i][j];
        game.pickedPiece.i = i;
        game.pickedPiece.j = j;       
        game.board[i][j].picked = true;
        if(game.board[i][j].type==="soldier") setSoldierTargets(i,j);
        // if(game.board[i][j].type==="queen") setQueenTargets();
        refreshScreen();
    }
    else if(game.board[i][j].type==="empty" && game.board[i][j].isValidTarget) //Click on valid empty spot
    {
        movePiece(i,j);
        UnsetTrgets();
        //pickedPiece now holds empty spot we moved to
        if(game.pickedPiece.piece.pieceEatingToGetHere!==undefined) //eating a piece to move
        {
            eatPiece(game.pickedPiece.piece.pieceEatingToGetHere);
            if(checkCanChainEat())
            {
                game.chainEating=true;
            }
        }
        endTurn();
    }
}
function endTurn()
{
    refreshScreen();
    game.playerIsDark = !game.playerIsDark;
}
function getEmptyTile()
{
    return {type:"empty",isValidTarget:false,pieceEatingToGetHere:undefined};
}
function movePiece(i,j)
{
    let temp =  game.board[i][j];
    game.pickedPiece.piece.picked=false;
    game.board[i][j] = game.pickedPiece.piece;
    game.pickedPiece.piece = temp;
    game.board[game.pickedPiece.i][game.pickedPiece.j]=temp;
    console.log(game.board)
}
function checkEating()
{


}
function UnsetTrgets()
{
    for(let i=0;i<8;i++)
        for(let j=0;j<8;j++)
            if(game.board[i][j].type==="empty")
                game.board[i][j].isValidTarget=false;
}
function eatPiece(piece)
{
    if(piece.isDark) game.darkPieces--;
    else game.lightPieces--;
    for(let i=0; i<8;i++)
        for(let j=0;j<8;j++)
            if(board[i][j]===piece)
                board[i][j]=getEmptyTile();
}

//Soldier specific Functions
function getSoldier(soldierIsDark,i,j)
{
    return {isDark: soldierIsDark,type: "soldier",picked:false};     
}

function setSoldierTargets(i,j)
{
    //set regular movement
    if(j<7 && game.board[i+(game.pickedPiece.piece.isDark?-1:1)][j+1].type==="empty")
        game.board[i+(game.pickedPiece.piece.isDark?-1:1)][j+1].isValidTarget = true;
    if(j>0 && game.board[i+(game.pickedPiece.piece.isDark?-1:1)][j-1].type==="empty")
        game.board[i+(game.pickedPiece.piece.isDark?-1:1)][j-1].isValidTarget = true;
}