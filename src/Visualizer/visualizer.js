import React from 'react';
import './visualizer.css';

class TreeNode {
    constructor(x, y, action, parent, g, h) {
        this.x = x;
        this.y = y;
        this.action = action;
        this.parent = parent;
        this.g = g;
        this.h = h;
        
    }
   
}

export default class visualizer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            cellSize: 15,
            width: 50,
            height: 40,
            canvasHeight: 15 * 40,
            canvasWidth: 15 * 50,
            gameMode: "Path",
            currentAlgorithm: "bfs",
            currentHeuristic: null
        }

        this.startPosition = null;
        this.goalPosition = null;
        this.openNodes = [];
        this.closedNodes = [];
        this.path = [];
        this.searchGrid = [];
        this.allActions = [[0,1],[1,0],[-1,0],[0,-1]];
        this.mapCellularAutomata = [];

        this.handleMouseClick = this.handleMouseClick.bind(this);
        this.handleMouseHover = this.handleMouseHover.bind(this);
        this.handleMapChange = this.handleMapChange.bind(this);
        this.handleAlgoChange = this.handleAlgoChange.bind(this);
        this.changeMode = this.changeMode.bind(this);
    }

    componentDidMount() {
        //setting height and width of all canvas
        this.canvasVis.width = this.state.canvasWidth;
        this.canvasVis.height = this.state.canvasHeight;

        this.canvasOverlay.width = this.state.canvasWidth;
        this.canvasOverlay.height = this.state.canvasHeight;

        this.canvasPath.width = this.state.canvasWidth;
        this.canvasPath.height = this.state.canvasHeight;

        this.getCanvasPosition(this.canvasOverlay);

        //initializing search grid array
        this.initializeSearchGrid();

        //drawing default map
        this.drawAutomataMap(3,4,5);
    }

    initializeSearchGrid() {

        let width = this.state.width;
        let height = this.state.height;

        //initializing searchGrid with Zeros as 2D array widthxheight
        this.searchGrid = new Array(width).fill(0).map(() => new Array(height).fill(0));

    }

    resetParameters() {
        this.openNodes = [];
        this.closedNodes = [];
        this.path = [];
    }

    resetSearchGrid() {
        for(let x = 0; x < this.state.width; x++){
            for(let y = 0; y < this.state.height; y++){
                this.searchGrid[x][y] = 0;
            }
        }
    }

    getCanvasPosition(canvasID) {
        let rect = canvasID.getBoundingClientRect();
        this.setState({ canvasPosition: {left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom } });
    }

    drawBlankMap() {

        for(let x = 0; x < this.state.width; x++){
            for(let y = 0; y < this.state.height; y++){
                let startingX = this.state.cellSize * x;
                let startingY = this.state.cellSize * y;
                this.drawCell(this.canvasVis,startingX,startingY,"#000000");
                this.fillCell(this.canvasVis,startingX,startingY,"#95deb9");
            }
        }
    }

    //method used to draw map using cellular automata
    drawAutomataMap(birthLimit, deathLimit, numberOfSimulations) {

        let width = this.state.width;
        let height = this.state.height;

        //initializing map array
        let automataMap = new Array(width).fill(0).map(() => new Array(height).fill(0));

        let chanceToBeginAlive = 0.40;

        //randomly initializing chance for cell to be alive for game of life
        for(let x = 0; x < width; x++){
            for(let y = 0; y < height; y++){
                if(Math.random() < chanceToBeginAlive){
                    automataMap[x][y] = 1;
                }
            }
        }

        //run simulaton step for cellular automata
        for(let i = 0; i < numberOfSimulations; i++){
            automataMap = this.automataSimulation(automataMap,birthLimit,deathLimit);
        }

        //draw map using celluar automata results
        for(let x = 0; x < width; x++){
            for(let y = 0; y < height; y++){
                let startingX = this.state.cellSize * x;
                let startingY = this.state.cellSize * y;

                if(automataMap[x][y] == 1){ //alive
                    this.drawCell(this.canvasVis,startingX,startingY,"#000000");
                    this.fillCell(this.canvasVis,startingX,startingY,"#95deb9");
                    this.searchGrid[x][y] = 0;
                }else{ // not alive
                    this.drawCell(this.canvasVis,startingX,startingY,"#000000");
                    this.fillCell(this.canvasVis,startingX,startingY,"#357553");

                    //updating search Grid
                    this.searchGrid[x][y] = 1;
                }
                
            }
        }

        
    }

    automataSimulation(map,birthLimit,deathLimit) {

        //initializing map array
        let newMap = new Array(this.state.width).fill(0).map(() => new Array(this.state.height).fill(0));

        //looping through map
        for(let x = 0; x < this.state.width; x++){
            for(let y = 0; y < this.state.height; y++){

                let numOfAliveNeighbors = this.countAliveNeighbors(map,x,y);

                if(map[x][y] == 1){
                    if(numOfAliveNeighbors < deathLimit){
                        newMap[x][y] = 0;
                    }else{
                        newMap[x][y] = 1;
                    }
                }else{
                    if(numOfAliveNeighbors > birthLimit){
                        newMap[x][y] = 1;
                    }else{
                        newMap[x][y] = 0;
                    }
                }

            }
        }

        return newMap;

    }

    countAliveNeighbors(map,x,y) {
        
        let alive = 0;

        for(let i = -1; i<2; i++){
            for(let j= -1; j<2; j++){

                let xNeighbour = x+i;
                let yNeighbour = y+j;
                
                if(i == 0 && j == 0){ continue; }

                if( (xNeighbour >= 0 && yNeighbour >= 0) && (xNeighbour < this.state.width && yNeighbour < this.state.height) )
                {
                    if(map[xNeighbour][yNeighbour] == 1)
                    {
                        alive++;
                    }
                }else
                {
                    alive++;
                }
            }
        }
    
        return alive;
    }

    drawCell(canvasID, startX, startY, color) {

        this.drawLine(canvasID,{x: startX, y: startY},{x: startX + this.state.cellSize, y: startY}, color);
        this.drawLine(canvasID,{x: startX + this.state.cellSize, y: startY},{x: startX + this.state.cellSize, y: startY + this.state.cellSize}, color);
        this.drawLine(canvasID,{x: startX, y: startY + this.state.cellSize},{x: startX + this.state.cellSize, y: startY + this.state.cellSize}, color);
        this.drawLine(canvasID,{x: startX, y: startY},{x: startX, y: startY + this.state.cellSize}, color);
        
    }

    drawLine(canvasID, start, end, color) {
        const ctx = canvasID.getContext("2d");
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.strokeStyle = color;
        ctx.lineTo(end.x,end.y);
        ctx.stroke();
        ctx.closePath();
    }

    //filling cell using top left coordiinates x and y of cell
    fillCell(canvasID, x, y, fillColor) {
        const ctx = canvasID.getContext("2d");
        ctx.beginPath();
        ctx.fillStyle = fillColor;
        ctx.moveTo(x, y);
        ctx.lineTo(x+this.state.cellSize,y);
        ctx.lineTo(x+this.state.cellSize,y + this.state.cellSize);
        ctx.lineTo(x,y + this.state.cellSize);
        ctx.lineTo(x,y);
        ctx.closePath();
        ctx.fill();
    }

    pixelToCell(pixelX,pixelY) {

        let row = Math.floor(pixelX / this.state.cellSize);
        let column = Math.floor(pixelY / this.state.cellSize);

        let cell = {x : row, y: column};

        return cell;

    }

    handleMouseClick(e) {
        const {left, right, top, bottom } = this.state.canvasPosition;
        let offsetX = e.pageX - left;
        let offsetY = e.pageY - top;

        //getting row and column cell which correspondds to where user clicked
        let cellClicked = this.pixelToCell(offsetX,offsetY);

        if(this.state.gameMode == "Path"){
            this.configurePath(cellClicked);
        }else{
            this.buildTerrain(cellClicked);
        }

    }

    handleMouseHover(e) {
        
        const {left, right, top, bottom } = this.state.canvasPosition; 
        let offsetX = e.pageX - left;
        let offsetY = e.pageY - top;

        //getting row and column of cell which correspondds to where user hovered
        let cellHovered = this.pixelToCell(offsetX,offsetY);

        //getting x and y pixel value for cell
        let pixelXValue = cellHovered.x * this.state.cellSize;
        let pixelYValue = cellHovered.y * this.state.cellSize;

        //clearing all cells on overlay canvas
        let ctx = this.canvasOverlay.getContext("2d");
        ctx.clearRect(0,0,this.state.canvasWidth,this.state.canvasHeight);

        //updating hovered cell
        this.drawCell(this.canvasOverlay,pixelXValue,pixelYValue,"#f7071f");
        
    }

    //method used to set start and goal position of path
    configurePath(gridCell) {

        let pixelX = gridCell.x * this.state.cellSize;
        let pixelY = gridCell.y * this.state.cellSize;

        if(this.startPosition == null){
            this.fillCell(this.canvasPath,pixelX,pixelY,"#f7071f");
            this.startPosition = {x: gridCell.x, y: gridCell.y};
        }else if(this.goalPosition == null){
            //checking if position is same as start Location
            let startPos = this.startPosition;

            //getting the type of terrain for start and goal position
            let stGridColor = this.searchGrid[startPos.x][startPos.y];
            let endGridColor = this.searchGrid[gridCell.x][gridCell.y];

            if( !(gridCell.x == this.startPosition.x && gridCell.y == this.startPosition.y) && stGridColor == endGridColor ){
                
                this.fillCell(this.canvasPath,pixelX,pixelY,"#34eb52");
                this.goalPosition = {x: gridCell.x, y: gridCell.y}; 

                //find path to goal location
                if(this.state.currentAlgorithm == "bfs" || this.state.currentAlgorithm == "dfs"){
                    this.depthBestSearch();
                }else {
                    this.heuristicSearch();
                }
                
            }
        }else{ // restarting goal and start position

            //clearing all cells
            let ctx = this.canvasPath.getContext("2d");
            ctx.clearRect(0,0,this.state.canvasWidth,this.state.canvasHeight);

            //reseting start position and goal position
            this.fillCell(this.canvasPath,pixelX,pixelY,"#f7071f");
            this.goalPosition = null;
            this.startPosition = {x: gridCell.x, y: gridCell.y};
        
            //reseting paramters for path finding
            this.resetParameters();
        }

    }

    buildTerrain(gridCell) {

        let pixelX = gridCell.x * this.state.cellSize;
        let pixelY = gridCell.y * this.state.cellSize;

        //checking to see if there is already this type of terrain on grid cell
        if(this.searchGrid[gridCell.x][gridCell.y] == 0){
            //coloring cell to indicate terrain
            this.fillCell(this.canvasVis,pixelX,pixelY,"#357553");
            this.drawCell(this.canvasVis,pixelX,pixelY,"#000000");

            //adding terrain to search grid so that we know where obstacles
            this.searchGrid[gridCell.x][gridCell.y] = 1;

        }

        

    }

    findPath(parentNode){
    
        let currentNode = parentNode;

        while (currentNode.parent != null){

            let previousState = currentNode.parent;
            this.path.push(currentNode.action);
            //finding node which corressponds to the parent node
            for(let i = 0; i < this.closedNodes.length; i++){
                let previousNode = this.closedNodes[i];
                if(previousNode.x == previousState[0] && previousNode.y == previousState[1]){
                    currentNode = previousNode;
                    break;
                }

            }
        }

        this.path.reverse();

        //drawing path to goal
        this.drawPath();
        
    }

    drawPath() {
       
        let currentPosition = this.startPosition;
        
        //looping through path actions
        for(let i = 0; i < this.path.length; i++){
            let pathAction = this.path[i];

            let newPositionX = currentPosition.x + pathAction[0];
            let newPositionY = currentPosition.y + pathAction[1];

            let pixelX = newPositionX * this.state.cellSize;
            let pixelY = newPositionY * this.state.cellSize;

            //drawing Path
            this.fillCell(this.canvasPath, pixelX, pixelY, "#ffffff");

            //updating current Position
            currentPosition = {x: newPositionX, y: newPositionY};
        }
    }

    containsElement(node,arr){
        let found = false;

        for(let i = 0; i < arr.length; i++){
            
            let val = arr[i];

            if(node.x == val.x && node.y == val.y){
                found = true;
                break;
            }
        }

        return found;      
    }

    isActionLegal(node, action){

        let width = this.state.width;
        let height = this.state.height;

        let newX = node.x + action[0];
        let newY = node.y + action[1];

        let childNode = {x: newX, y: newY};
       
        let closedList = this.closedNodes;
        let openList = this.openNodes;

    
        if( (newX < 0 || newY < 0) || (newX >= width || newY >= height ) ){ //check if action will bring us outside map
            return false;
        }else if(this.containsElement(childNode,closedList)){ //checking if action will lead to already expanded node
            return false;
        }else if(this.containsElement(childNode,openList)){ // checking to see if action will lead to node in open list
            return false;
        }else if(this.searchGrid[node.x][node.y] != this.searchGrid[newX][newY]){ //used to check if parent and child node generated from action is the same type of terrain or color.
            return false;
        }
        else{
            return true;
        } 

    }

    isValidHeuristicAction(node, action){

        let width = this.state.width;
        let height = this.state.height;

        let newX = node.x + action[0];
        let newY = node.y + action[1];

        let childNode = {x: newX, y: newY};
       
        let closedList = this.closedNodes;
    
        if( (newX < 0 || newY < 0) || (newX >= width || newY >= height ) ){ //check if action will bring us outside map
            return false;
        }else if(this.containsElement(childNode,closedList)){ //checking if action will lead to already expanded node
            return false;
        }else if(this.searchGrid[node.x][node.y] != this.searchGrid[newX][newY]){ //used to check if parent and child node generated from action is the same type of terrain or color.
            return false;
        }else{
            return true;
        } 

    }

    estimateHeuristic(node,goal){

        let horizontalDistance = Math.abs(goal.x - node.x);
        let verticalDistance =  Math.abs(goal.y - node.y);

        let distanceSquared = Math.pow(horizontalDistance,2) + Math.pow(verticalDistance,2);

        return Math.sqrt(distanceSquared);

    }

    popMinCostNode() {

        let minF = Infinity;
        let minNode = null;
        let nodeIndex = null;

        for(let i = 0; i < this.openNodes.length; i++){
            let node = this.openNodes[i];

            let fCost = node.g + node.h;

            if( fCost < minF){
                minNode = node;
                nodeIndex = i;
                minF = fCost;
            }
        }

        //removing the min node from the list
        this.openNodes.splice(nodeIndex,1);

        return minNode;

    }

    findNode(x,y,openList){

        for(let i = 0; i < openList.length; i++){
            let node = openList[i];
            if(node.x == x && node.y == y){
                return node;
            }
        }
    }

    //method used to perform best first search or depth first search
    depthBestSearch(){

        let startPosition = this.startPosition;
        let rootNode = new TreeNode(startPosition.x, startPosition.y,null,null,null,null);

        //adding root node to open list
        this.openNodes.push(rootNode);

        while(this.openNodes.length != 0){ //looping through open list until it is empty
            let parentNode = this.state.currentAlgorithm == "bfs" ? this.openNodes.shift() : this.openNodes.pop();
            
            for(let i = 0; i < this.allActions.length; i++){
                let action = this.allActions[i];
    
                let isLegal = this.isActionLegal(parentNode,action);

                if(isLegal){
                    let childNodeX = action[0] + parentNode.x;
                    let childNodeY = action[1] + parentNode.y;

                    //checking to see if we are at goal node
                    if(childNodeX == this.goalPosition.x && childNodeY == this.goalPosition.y){
                        //finding Path
                        this.findPath(parentNode);
                    }

                    //adding to open list
                    this.openNodes.push(new TreeNode(childNodeX, childNodeY, action, [parentNode.x,parentNode.y],null,null));
                }
                
            }

            //adding expanded parent node to closed list 
            this.closedNodes.push(parentNode); 
        }

        if(this.path.length == 0 && this.openNodes.length == 0){ //path could not be found
            alert("Path could not be found!");

            //reseting start and goal position

            //clearing all cells
            let ctx = this.canvasPath.getContext("2d");
            ctx.clearRect(0,0,this.state.canvasWidth,this.state.canvasHeight);

            //reseting start position and goal position
            this.goalPosition = null;
            this.startPosition = null;
        
            //reseting paramters for path finding
            this.resetParameters();

        }
    }

    heuristicSearch() {

        //adding root node
        let startPosition = this.startPosition;
        let goalPosition = this.goalPosition;

        let foundGoal = false;

        let rootHeuristicCost = this.state.currentHeuristic == "ucs" ? 0 : this.estimateHeuristic(startPosition, goalPosition);
       
        let rootNode = new TreeNode(startPosition.x, startPosition.y,[0,0],null,0,rootHeuristicCost);
        this.openNodes.push(rootNode);

        while(this.openNodes.length > 0 && !foundGoal){ //looping through open list until it is empty
            
            //finding node with the minimum f(n)
            let parentNode = this.popMinCostNode();
            
            for(let i = 0; i < this.allActions.length; i++){
                let action = this.allActions[i];
    
                let isLegal = this.isValidHeuristicAction(parentNode,action);

                if(isLegal){
                    let childNodeX = action[0] + parentNode.x;
                    let childNodeY = action[1] + parentNode.y;

                    //checking to see if we are at goal node
                    if(childNodeX == this.goalPosition.x && childNodeY == this.goalPosition.y){
                        if(!foundGoal){
                            this.findPath(parentNode);
                        }
                        foundGoal = true;
                    }

                    let childNode = {x: childNodeX, y: childNodeY};

                    let gCost = this.state.currentHeuristic == "gbfs" ? 0 : parentNode.g + 100;
                    let hCost = this.state.currentHeuristic == "ucs" ? 0 : this.estimateHeuristic(childNode,goalPosition);

                    //checking to see if there is same cell in open list with better G Cost
                    let node = this.findNode(childNodeX,childNodeY,this.openNodes);
                    if(node){
                        //checking if other path is better than taking this current action
                        if(node.g <= gCost){
                            continue;
                        }
                    }

                    //adding to open list
                    this.openNodes.push(new TreeNode(childNodeX, childNodeY, action, [parentNode.x,parentNode.y],gCost,hCost));
                }
                
            }

            //adding expanded parent node to closed list 
            this.closedNodes.push(parentNode); 
        }

        if(this.path.length == 0 && this.openNodes.length == 0){ //path could not be found
            alert("Path could not be found!");

            //reseting start and goal position

            //clearing all cells
            let ctx = this.canvasPath.getContext("2d");
            ctx.clearRect(0,0,this.state.canvasWidth,this.state.canvasHeight);

            //reseting start position and goal position
            this.goalPosition = null;
            this.startPosition = null;
        
            //reseting paramters for path finding
            this.resetParameters();

        }
    }

    handleAlgoChange = (event) => {


        this.resetParameters();

        //reseting start and goal position as well
        this.startPosition = null;
        this.goalPosition = null;

        //reseting canvas which draws path
        let ctx2 = this.canvasPath.getContext("2d");
        ctx2.clearRect(0,0,this.state.canvasWidth,this.state.canvasHeight);


        if(event.target.value == "bfs"){
            this.setState({ currentAlgorithm: "bfs"});
        }else if(event.target.value == "dfs"){
            this.setState({ currentAlgorithm: "dfs"})
        }else{ //A* star
            this.setState({ currentAlgorithm: "heuristic"});

            if(event.target.value == "ucs"){
                this.setState({ currentHeuristic: "ucs" });
            }else if(event.target.value == "gbfs"){
                this.setState({ currentHeuristic: "gbfs" });
            }else{
                this.setState({ currentHeuristic: "aStar" });
            }
        }
       
    }

    handleMapChange = (event) => {

        //reseting search Grid
        this.resetSearchGrid();

        this.resetParameters();

        //reseting start and goal position as well
        this.startPosition = null;
        this.goalPosition = null;

        //reseting base map and path map
        let ctx = this.canvasVis.getContext("2d");
        ctx.clearRect(0,0,this.state.canvasWidth,this.state.canvasHeight);

        let ctx2 = this.canvasPath.getContext("2d");
        ctx2.clearRect(0,0,this.state.canvasWidth,this.state.canvasHeight);

        if(event.target.value == "default"){
            this.drawAutomataMap(3,4,5);
        }else if(event.target.value == "maze"){ //drawing a more dense map
            this.drawAutomataMap(3,1,1);
        }else{ // blank map
            this.drawBlankMap();
        }
       
    }

    changeMode() {

        if(this.state.gameMode == "Path"){
            this.setState({ gameMode: "Build"});
        }else{
            this.setState({ gameMode: "Path"});
        }
    }





    render() {
        let gameMode = this.state.gameMode;

        return (
            <div className="main">
                <div>
                    <canvas ref={ canvasVis => this.canvasVis = canvasVis}></canvas>
                    <canvas ref={ canvasPath => this.canvasPath = canvasPath} onMouseDown = {this.handleMouseClick}></canvas>
                    <canvas ref={ canvasOverlay => this.canvasOverlay = canvasOverlay} onMouseDown = {this.handleMouseClick} onMouseMove = {this.handleMouseHover} ></canvas>
                </div>
                

                <div className="controls">
                    <h1 style={{ marginTop: 10}}>Config/Controls</h1>
                    <button className="creativeButton" onClick={this.changeMode}>{gameMode == "Path" ? "Path Mode" : "Build Mode"}</button>

                    <label for="maps">Choose Map:</label>
                    <select className="mapSelection" id="maps" name="maps" onChange={this.handleMapChange}>
                        <option value="default">Cave</option>
                        <option value="maze">Maze</option>
                        <option value="blank">Blank</option>
                    </select>
                    
                    <label for="algo">Choose a Path Finding Algorithm:</label>
                    <select id="algo" name="algo" onChange={this.handleAlgoChange}>
                        <option value="bfs">Best First Search</option>
                        <option value="dfs">Depth First Search</option>
                        <option value="aStar">A* Search </option>
                        <option value="gbfs">Greedy Best-First Search</option>
                        <option value="ucs">Uniform Cost Search</option>
                    </select>
                    
                </div>
                
            </div>
        )
    }
}