function CheckersGame(options) {
	options = (typeof options == 'undefined') ? {} : options;

	this.board = (options.board === undefined) ? new CheckerBoard() : options.board;
	this._setUp();
}
CheckersGame.PLAYERS = {
	RED: 0,
	BLACK: 1
};
CheckersGame.prototype._setUp = function() {
	var column;
	var row;

	// Populate black spaces on top three rows of the board with black pieces
	for (column = 0; column < 8; ++column) {
		for (row = 0; row < 3; ++row) {
			if (this.board.isBlackSpace(new Vector2(column, row))) {
				this.board.setPiece(new Vector2(column, row), new CheckerPiece(CheckersGame.PLAYERS.BLACK));
			}
		}
	}

	// Populate black spaces on bottom three rows of the board with red pieces
	for (column = 0; column < 8; ++column) {
		for (row = 5; row < 8; ++row) {
			if (this.board.isBlackSpace(new Vector2(column, row))) {
				this.board.setPiece(new Vector2(column, row), new CheckerPiece(CheckersGame.PLAYERS.RED));
			}
		}
	}
};
CheckersGame.prototype.getLegalMoves = function(piece) {
	if (piece === null) return [];

	var legalTargets = [];

	var movementVectors = piece.getMovementVectors();
	for (var movementVector in movementVectors) {
		movementVector = movementVectors[movementVector];

		var potentialTarget = piece.position.add(movementVector);
		var piece2 = this.board.getPiece(potentialTarget);

		if (this.board.isValidSpace(potentialTarget)) {
			if (this.board.isEmptySpace(potentialTarget)) {
				legalTargets.push(potentialTarget);
			} else if (piece.owner != this.board.getPiece(potentialTarget).owner) { // If jump might be possible...
				potentialTarget = potentialTarget.add(movementVector);

				if (this.board.isValidSpace(potentialTarget) && this.board.isEmptySpace(potentialTarget)) legalTargets.push(potentialTarget);
			}
		}
	}

	return legalTargets;
};
CheckersGame.prototype.isLegalMove = function(piece, pos) {
	var legalMoves = this.getLegalMoves(piece);
	for (var move in legalMoves) {
		move = legalMoves[move];
		if (move.equals(pos)) return true;
	}
	return false;
};
CheckersGame.prototype.doMove = function(piece, pos) {
	if (!this.isLegalMove(piece, pos)) return false;

	var movementVector = pos.subtract(piece.position);
	if (Math.abs(movementVector.x) > 1 || Math.abs(movementVector.y) > 1) { // Jump
		var direction = new Vector2(movementVector.x > 0 ? 1 : -1, movementVector.y > 0 ? 1 : -1);
		var jumpedPos = piece.position.add(direction);

		this.board.clearPiece(this.board.getPiece(jumpedPos));
	}

	this.board.clearPiece(piece);
	this.board.setPiece(pos, piece);
};

/*
* A standard, 8x8 American checker board.
*/
function CheckerBoard() {
	this._board = new Array(8);
	this._initialize();
}
CheckerBoard.prototype._initialize = function() {
	this._board = new Array(8);
	for (var i = 0; i < 8; ++i) {
		this._board[i] = new Array(8);
	}
};
CheckerBoard.prototype.isBlackSpace = function(pos) {
	var isWhite = ((pos.x + pos.y) % 2) === 0;
	return !isWhite;
};
CheckerBoard.prototype.isValidSpace = function(pos) {
	if (pos === null || pos === undefined) return false;
	return (pos.x >= 0 && pos.x < 8) && (pos.y >= 0 && pos.y < 8);
};
CheckerBoard.prototype.isEmptySpace = function(pos) {
	return this.getPiece(pos) === null;
};
CheckerBoard.prototype.getPiece = function(pos) {
	if (!this.isValidSpace(pos)) return undefined;

	var piece = this._board[pos.x][pos.y];
	return (typeof piece == 'undefined') ? null : piece;
};
CheckerBoard.prototype.setPiece = function(pos, piece) {
	if (piece.position !== null) throw "Piece " + piece + " cannot be on more than one tile at once.";

	piece.position = pos;
	this._board[pos.x][pos.y] = piece;
};
CheckerBoard.prototype.clearPiece = function(piece) {
	if (piece.position === null) throw "Piece " + piece + " cannot be cleared because it is not on the board.";

	var pos = piece.position;
	piece.position = null;
	this._board[pos.x][pos.y] = null;
};


function Vector2(x, y) {
	this.x = x;
	this.y = y;
}
Vector2.prototype.add = function(other) {
	if (!(other instanceof Vector2)) throw "Cannot add '" + other + "'' to '" + this + "'!";
	return new Vector2(this.x + other.x, this.y + other.y);
};
Vector2.prototype.subtract = function(other) {
	if (!(other instanceof Vector2)) throw "Cannot subtract '" + other + "'' from '" + this + "'!";
	return new Vector2(this.x - other.x, this.y - other.y);
};
Vector2.prototype.equals = function(other) {
	return ((other instanceof Vector2) && (this.x == other.x) && (this.y == other.y));
};

function CheckerPiece(owner, rank) {
	rank = typeof rank !== 'undefined' ? rank : this.RANKS.MAN;

	this.owner = owner;
	this.rank = rank;
	this.position = null;
}
CheckerPiece.prototype.getMovementVectors = function () {
	var movementVectors = [];
	if (this.owner == CheckersGame.PLAYERS.RED || this.rank == this.RANKS.KING) movementVectors.push(new Vector2(-1, -1), new Vector2(1, -1));
	if (this.owner == CheckersGame.PLAYERS.BLACK || this.rank == this.RANKS.KING) movementVectors.push(new Vector2(-1, 1), new Vector2(1, 1));
	return movementVectors;
};
CheckerPiece.prototype.RANKS = {
	MAN: 0,
	KING: 1
};


/*
* A proxy for the CheckerBoard class which mirrors changes made to the board
* in the UI.
*/
function HTMLCheckerBoard(htmlElement) {
	this._htmlBoard = $(htmlElement).first();

	this._boardSpaces = new Array(8);
	this._parseSpaces();

	this._board = new CheckerBoard();
}
HTMLCheckerBoard.prototype._parseSpaces = function() {
	this._initialize();

	var rows = this._htmlBoard.find("tr");

	var columnNum;
	var rowNum;

	for (rowNum = 0; rowNum < 8; ++rowNum) {
		var row = $(rows[rowNum]).find("td");
		for (columnNum = 0; columnNum < 8; ++columnNum) {
			this._boardSpaces[columnNum][rowNum] = $(row[columnNum]);
		}
	}
};
HTMLCheckerBoard.prototype._initialize = function() {
	this._boardSpaces = new Array(8);
	for (var i = 0; i < 8; ++i) {
		this._boardSpaces[i] = new Array(8);
	}
};

HTMLCheckerBoard.prototype.isBlackSpace = function(pos) {
	return this._board.isBlackSpace(pos);
};
HTMLCheckerBoard.prototype.isValidSpace = function(pos) {
	return this._board.isValidSpace(pos);
};
HTMLCheckerBoard.prototype.isEmptySpace = function(pos) {
	return this._board.isEmptySpace(pos);
};
HTMLCheckerBoard.prototype.getPiece = function(pos) {
	return this._board.getPiece(pos);
};
HTMLCheckerBoard.prototype.setPiece = function(pos, piece) {
	this._board.setPiece(pos, piece);

	var space = this._boardSpaces[pos.x][pos.y];
	space.empty();

	var newPiece = $(document.createElement('div'));
	newPiece.addClass('piece');
	newPiece.addClass((piece.owner == CheckersGame.PLAYERS.RED ? 'red' : 'black') + '-piece');

	space.append(newPiece);
};
HTMLCheckerBoard.prototype.clearPiece = function(piece) {
	var pos = piece.position;

	this._board.clearPiece(piece);
	this._boardSpaces[pos.x][pos.y].empty();
};

$(document).ready(function() {
	var game = new CheckersGame({board: new HTMLCheckerBoard(".checkers-board")});
});
