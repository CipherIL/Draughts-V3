const darkSoldierImg = "/Images/Checkers_Dark_Piece.png";
const darkQueenImg = "/Images/Checkers_Dark_Piece_Queen.png";
const lightSoldierImg = "/Images/Checkers_Light_Piece.png";
const lightQueenImg = "/Images/Checkers_Light_Piece_Queen.png";
const game={};

initHTMLBoardGraphics();
initEventDetectors();
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
function initEventDetectors()
{
    let boardClickDetector = document.getElementById("tiles-container");
    boardClickDetector.addEventListener('click',(e)=>{
        if(e.target.classList.contains("dark"))
        {
            handleUserClick(parseInt(e.target.id[0]),parseInt(e.target.id[1]));
        }
    })
    document.getElementById("end-chain-eating").addEventListener('click',(e)=>{
        endTurn();
        e.target.style.display = "none";
    });
    
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
    updateGameDataGraphic();
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
function updateGameDataGraphic()
{
    document.getElementById("display-current-player").innerHTML = game.playerIsDark?"Black":"White";
    document.getElementById("end-chain-eating").style = game.chainEating?"":"display: none;"
    
}

//General Game Functions
function handleUserClick(i,j)
{
    //Click on valid soldier
    if(game.board[i][j].type!=="empty" && game.board[i][j].isDark === game.playerIsDark && !game.chainEating)
    {
        if(game.pickedPiece.piece !== undefined)
        {
            game.pickedPiece.piece.picked = false;
            UnsetTargets();
        }
        game.pickedPiece.piece = game.board[i][j];
        game.pickedPiece.i = i;
        game.pickedPiece.j = j;       
        game.board[i][j].picked = true;
        if(game.board[i][j].type==="soldier") setSoldierTargets(i,j);
        if(game.board[i][j].type==="queen") setQueenTargets(i,j);
        refreshScreen();
    }
    else if(game.board[i][j].type==="empty" && game.board[i][j].isValidTarget) //Click on valid empty spot
    {
        if(game.board[i][j].pieceEatingToGetHere===undefined)//Moving without eating
        {
            movePiece(i,j);
            endTurn();
        }
        else //Moving with eating
        {   
            unmarkPiecesCanEat(); //Eating so no burning
            eatPiece(game.board[i][j].pieceEatingToGetHere);
            movePiece(i,j);
            UnsetTargets();
            if(checkCanChainEat(i,j))
            {
                game.chainEating = true;
                game.board[i][j].canEat=true; //piece will burn if stopping mid chain eating
                refreshScreen();
            }
            else endTurn();
        }
    }
}
function endTurn()
{
    UnsetTargets();
    burnMarkedPieces();
    refreshScreen();
    game.chainEating = false;
    game.playerIsDark = !game.playerIsDark;
    checkWin();
    updatePiecesCanEat();
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
    checkAndPromote(i,j)
}
function UnsetTargets()
{
    for(let i=0;i<8;i++)
        for(let j=0;j<8;j++)
            if(game.board[i][j].type==="empty")
            {
                game.board[i][j].isValidTarget=false;
                game.board[i][j].pieceEatingToGetHere=undefined;
            }
}
function eatPiece(piece)
{
    if(piece.isDark) game.darkPieces--;
    else game.lightPieces--;
    for(let i=0; i<8;i++)
        for(let j=0;j<8;j++)
        {
            if(game.board[i][j] === "empty")
            {
                game.board[i][j].isValidTarget=false;
                game.board[i][j].pieceEatingToGetHere = undefined;
            }
            if(i === piece.i && j === piece.j)
                game.board[i][j] = getEmptyTile();
        }
}
function checkCanChainEat(i,j)
{
    let canEat = false;
    directions = ["UR","UL","DR","DL"];
    for(let dir of directions)    
        if(canEatInDir(i,j,dir))
        {
            setTarget(i,j,dir);
            canEat = true;
        }
    if(canEat)
    {
        game.pickedPiece={piece:game.board[i][j],i:i,j:j}
    }       
    return canEat;   
}
function canEatInDir(i,j,dir)
{
    if(dir[0]==="D" && i>=6) return false;
    if(dir[0]==="U" && i<=1) return false;
    if(dir[1]==="R" && j>=6) return false;
    if(dir[1]==="L" && j<=1) return false;
    if(game.board[i+(dir[0]==="D"?1:-1)][j+(dir[1]==="R"?1:-1)].type==="soldier" &&
       game.board[i+(dir[0]==="D"?1:-1)][j+(dir[1]==="R"?1:-1)].isDark!==game.playerIsDark &&
       game.board[i+(dir[0]==="D"?2:-2)][j+(dir[1]==="R"?2:-2)].type==="empty") return true;
       return false; 
}
function setTarget(i,j,dir)
{
    game.board[i+(dir[0]==="D"?2:-2)][j+(dir[1]==="R"?2:-2)].isValidTarget = true;
    game.board[i+(dir[0]==="D"?2:-2)][j+(dir[1]==="R"?2:-2)].pieceEatingToGetHere=
    {i:i+(dir[0]==="D"?1:-1),j:j+(dir[1]==="R"?1:-1)};
}
function updatePiecesCanEat()
{
    for(let i=0;i<8;i++)
        for(let j=0;j<8;j++)        
            if(game.board[i][j].type !== "empty" && game.board[i][j].isDark === game.playerIsDark)
                markIfCanEat(i,j);
}
function markIfCanEat(i,j)
{
    if(game.board[i][j].type==="soldier")
    {
        if(game.board[i][j].isDark===true) //dark soldier
        {
            if(canEatInDir(i,j,"UL")||canEatInDir(i,j,"UR"))
                game.board[i][j].canEat = true;
        }
        else //light soldier
        {
            if(canEatInDir(i,j,"DL")||canEatInDir(i,j,"DR"))
                game.board[i][j].canEat = true;
        }        
    }
    else //queen
    {
        if(queenCanEat(i,j))        
            game.board[i][j].canEat = true;        
    }
}
function burnMarkedPieces()
{
    for(let i=0;i<8;i++)
        for(let j=0;j<8;j++)
        {
            if(game.board[i][j].canEat)
            {
                if(game.board[i][j].isDark) game.darkPieces--;
                else game.lightPieces--;
                game.board[i][j] = getEmptyTile();
            }
        }
}
function unmarkPiecesCanEat()
{
    for(let i=0;i<8;i++)
        for(let j=0;j<8;j++)
            if(game.board[i][j].type!=="empty")
                game.board[i][j].canEat = false;            
}
function checkWin()
{
    let gameOver = false;
    let winBox = document.getElementById("win-box");
    if(game.darkPieces === 0)
    {
        winBox.children[0].innerHTML = "White Wins!";
        winBox.children[1].innerHTML = "Black has no more pieces";
        gameOver = true;
    }
    if(game.lightPieces === 0)
    {
        winBox.children[0].innerHTML = "Black Wins!";
        winBox.children[1].innerHTML = "White has no more pieces";
        gameOver = true;
    }
    if(!gameOver)
    {
        if(checkNoMoreMoves(game.playerIsDark))
        {
            winBox.children[0].innerHTML = game.playerIsDark?"White Wins!":"Black Wins!";
            winBox.children[1].innerHTML = (game.playerIsDark?"Black":"White")+" has no moves left";
            gameOver = true;
        }
    }
    if(gameOver)
        winBox.parentNode.style.display = "";
}
function checkNoMoreMoves(isDark)
{
    for(let i=0;i<8;i++)
        for(let j=0;j<8;j++)        
            if(game.board[i][j].type!=="empty" && game.board[i][j].isDark===isDark)            
                if(game.board[i][j].type==="soldier" && soldierHasMoves(i,j)) return false;       
    return true;
}
//Soldier Specific Functions
function getSoldier(soldierIsDark,i,j)
{
    return {
        isDark: soldierIsDark,
        type: "soldier",
        picked:false,
        canEat: false};     
}
function setSoldierTargets(i,j)
{
    //set regular movement
    if(j<7 && game.board[i+(game.pickedPiece.piece.isDark?-1:1)][j+1].type === "empty")
        game.board[i+(game.pickedPiece.piece.isDark?-1:1)][j+1].isValidTarget = true;
    if(j>0 && game.board[i+(game.pickedPiece.piece.isDark?-1:1)][j-1].type === "empty")
        game.board[i+(game.pickedPiece.piece.isDark?-1:1)][j-1].isValidTarget = true;

    //set eating movement
    //Right
    if(j<6 && game.board[i+(game.pickedPiece.piece.isDark?-1:1)][j+1].type !== "empty" &&
       game.board[i+(game.pickedPiece.piece.isDark?-1:1)][j+1].isDark !== game.playerIsDark &&
       game.board[i+(game.pickedPiece.piece.isDark?-2:2)][j+2].type === "empty")
       {
            game.board[i+(game.pickedPiece.piece.isDark?-2:2)][j+2].isValidTarget = true;
            game.board[i+(game.pickedPiece.piece.isDark?-2:2)][j+2].pieceEatingToGetHere = 
            {i:i+(game.pickedPiece.piece.isDark?-1:1),j:j+1}
       }
    //Left
    if(j>1 && game.board[i+(game.pickedPiece.piece.isDark?-1:1)][j-1].type !== "empty" &&
        game.board[i+(game.pickedPiece.piece.isDark?-1:1)][j-1].isDark !== game.playerIsDark &&
        game.board[i+(game.pickedPiece.piece.isDark?-2:2)][j-2].type === "empty")
        {
            game.board[i+(game.pickedPiece.piece.isDark?-2:2)][j-2].isValidTarget = true;
            game.board[i+(game.pickedPiece.piece.isDark?-2:2)][j-2].pieceEatingToGetHere =
            {i:i+(game.pickedPiece.piece.isDark?-1:1),j:j-1};
        }
}
function checkAndPromote(i,j)
{
    if(game.board[i][j].type==="soldier")
    {
        if(game.board[i][j].isDark && i===0)
            promote(i,j);
        if(!game.board[i][j].isDark && i===7)
            promote(i,j);
    }       
}
function promote(i,j)
{
    game.board[i][j]={
        isDark: game.board[i][j].isDark,
        type: "queen",
        picked: false,
        canEat: game.board[i][j].canEat
    }
}
function soldierHasMoves(i,j)
{
    //can move left or right
    if(j<7 && game.board[i+(game.board[i][j].isDark?-1:1)][j+1].type === "empty") return true;
    if(j>0 && game.board[i+(game.board[i][j].isDark?-1:1)][j-1].type === "empty") return true;
    //can eat left or right
    if(j<6 && game.board[i+(game.pickedPiece.piece.isDark?-1:1)][j+1].type !== "empty" &&
       game.board[i+(game.pickedPiece.piece.isDark?-1:1)][j+1].isDark !== game.playerIsDark &&
       game.board[i+(game.pickedPiece.piece.isDark?-2:2)][j+2].type === "empty") return true;    
    if(j>1 && game.board[i+(game.pickedPiece.piece.isDark?-1:1)][j-1].type !== "empty" &&
       game.board[i+(game.pickedPiece.piece.isDark?-1:1)][j-1].isDark !== game.playerIsDark &&
       game.board[i+(game.pickedPiece.piece.isDark?-2:2)][j-2].type === "empty") return true;
    return false;
}
//Queen Specific Functions
function setQueenTargets(i,j)
{
    if(i<7 && j<7) setQueenTargetsInDir(i,j,"DR");
    if(i<7 && j>0) setQueenTargetsInDir(i,j,"DL");
    if(i>0 && j<7) setQueenTargetsInDir(i,j,"UR");
    if(i>0 && j>0) setQueenTargetsInDir(i,j,"UL");  
}
function setQueenTargetsInDir(i,j,dir)
{
    let iOffset,jOffset,iEnd,jEnd;
    let mul = 1;
    if(dir.includes("D")) {iOffset = 1; iEnd = 8;}
    else {iOffset = -1; iEnd = -1;}
    if(dir.includes("R")) {jOffset = 1; jEnd = 8}
    else {jOffset = -1; jEnd = -1;}
    while((i+(iOffset*mul)!==iEnd)&&(j+(jOffset*mul)!==jEnd))
    {
        if(game.board[i+(iOffset*mul)][j+(jOffset*mul)].type === "empty") //valid empty spot        
            game.board[i+(iOffset*mul)][j+(jOffset*mul)].isValidTarget = true;
        else if(game.board[i+(iOffset*mul)][j+(jOffset*mul)].type === "soldier" &&
           game.board[i+(iOffset*mul)][j+(jOffset*mul)].isDark === game.board[i][j].isDark) //Ally soldier
           break;
        else if(game.board[i+(iOffset*mul)][j+(jOffset*mul)].type === "soldier" &&
           game.board[i+(iOffset*mul)][j+(jOffset*mul)].isDark !== game.board[i][j].isDark) //Enemy soldier
           {
                if((i+(iOffset*(mul+1))!=iEnd)&&(j+(jOffset*(mul+1))!=jEnd) &&
                    game.board[i+(iOffset*(mul+1))][j+(jOffset*(mul+1))].type === "empty")
                    {
                        game.board[i+(iOffset*(mul+1))][j+(jOffset*(mul+1))].isValidTarget = true;
                        game.board[i+(iOffset*(mul+1))][j+(jOffset*(mul+1))].pieceEatingToGetHere = 
                        {i:i+(iOffset*mul),j:j+(jOffset*mul)};
                    }                
                break;                
           }
        mul++;
    } 
}
function queenCanEat(i,j)
{
    if(queenCanEatInDir(i,j,"UR")||queenCanEatInDir(i,j,"UL")||
       queenCanEatInDir(i,j,"DR")||queenCanEatInDir(i,j,"DL")) return true;
    return false;        
}
function queenCanEatInDir(i,j,dir)
{
    let iOffset,jOffset,iEnd,jEnd;
    let mul = 1;
    if(dir.includes("D")) {iOffset = 1; iEnd = 8;}
    else {iOffset = -1; iEnd = -1;}
    if(dir.includes("R")) {jOffset = 1; jEnd = 8}
    else {jOffset = -1; jEnd = -1;}
    while((i+(iOffset*mul)!==iEnd)&&(j+(jOffset*mul)!==jEnd))
    {
        if(game.board[i+(iOffset*mul)][j+(jOffset*mul)].type === "soldier" &&
           game.board[i+(iOffset*mul)][j+(jOffset*mul)].isDark === game.board[i][j].isDark) //Ally soldier
           break;
        //if you find an eatable enemy soldier return true
        if(game.board[i+(iOffset*mul)][j+(jOffset*mul)].type === "soldier" &&
           game.board[i+(iOffset*mul)][j+(jOffset*mul)].isDark !== game.board[i][j].isDark)
           {
                if((i+(iOffset*(mul+1))!=iEnd)&&(j+(jOffset*(mul+1))!=jEnd) &&
                   game.board[i+(iOffset*(mul+1))][j+(jOffset*(mul+1))].type === "empty")
                   return true;
                break;
           }
        mul++;
    }
    return false;
}