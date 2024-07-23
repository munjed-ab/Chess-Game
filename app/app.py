from flask import Flask, render_template, request, jsonify, Response
import chess

#munged_208908

app = Flask(__name__)

board = chess.Board()
playerColor = True
computerColor = False

alpha = -float('inf')
beta = float('inf')
last_move = None


@app.route('/favicon.ico')
def favicon():
    return Response(status=204)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/game', methods=['POST'])
def game():
    global playerColor, computerColor
    color = request.form.get("color")
    if not color:
        color = "w"
    if color == "w":
        playerColor = chess.WHITE
        computerColor = chess.BLACK
    else:
        playerColor = chess.BLACK
        computerColor = chess.WHITE

    return render_template('chess.html', color=color, turn=board.turn)


@app.route('/reset_game_with_color', methods=['POST'])
def reset():
    color = request.json.get('color')
    reset_game_with_color(color)
    return jsonify(message='Game reset with color: {}'.format(color))


@app.route('/turn')
def get_turn():
    global board
    turn = board.turn  # Assuming `board` is your chessboard object
    return jsonify({'turn': turn})


@app.route('/get_moves', methods=['GET'])
def get_moves():
    global board
    moves = [move.uci() for move in board.legal_moves]

    for i in range(len(moves)):
        if len(moves[i]) >= 5:
            moves[i] = moves[i][:4]

    moves = list(set(moves))

    return jsonify({'moves': moves})


@app.route('/get_color', methods=['GET'])
def get_color():
    color = "w" if playerColor else "b"
    return jsonify({'color': color})


@app.route('/make_move', methods=['POST'])
def send_move():
    global board
    move = request.json.get('move')
    board.push_uci(move)
    return jsonify({'success': True})


@app.route('/get_move', methods=['GET'])
def get_move():
    global board
    computerMove = computer_move()
    computer_move_uci = computerMove.uci()
    if len(computer_move_uci) >= 5:
        computer_move_uci = computer_move_uci[:4]
    board.push(computerMove)
    return jsonify({'C_move': computer_move_uci})


def evaluate_board(board):  # Count the material balance

    piece_values = {chess.PAWN: 1, chess.KNIGHT: 3, chess.BISHOP: 3, chess.ROOK: 5,
                    chess.QUEEN: 9, chess.KING: 0}
    score = 0
    for square, piece in board.piece_map().items():
        value = piece_values[piece.piece_type]
        if piece.color == chess.WHITE:
            score += value
        else:
            score -= value
    for square, piece in board.piece_map().items():
        if piece.color == chess.WHITE:
            if piece.piece_type == chess.PAWN:
                score += 10 + (7 - chess.square_distance(square, chess.E2))
            elif piece.piece_type == chess.KNIGHT:
                score += 30 + len(board.attacks(square))
            elif piece.piece_type == chess.BISHOP:
                score += 30 + len(board.attacks(square))
            elif piece.piece_type == chess.ROOK:
                score += 50 + len(board.attacks(square))
            elif piece.piece_type == chess.QUEEN:
                score += 90 + len(board.attacks(square))
            elif piece.piece_type == chess.KING:
                score += 900 + len(board.attacks(square))
        else:
            if piece.piece_type == chess.PAWN:
                score -= 10 + (chess.square_distance(square, chess.E7))
            elif piece.piece_type == chess.KNIGHT:
                score -= 30 + len(board.attacks(square))
            elif piece.piece_type == chess.BISHOP:
                score -= 30 + len(board.attacks(square))
            elif piece.piece_type == chess.ROOK:
                score -= 50 + len(board.attacks(square))
            elif piece.piece_type == chess.QUEEN:
                score -= 90 + len(board.attacks(square))
            elif piece.piece_type == chess.KING:
                score -= 900 + len(board.attacks(square))
    return score


def get_legal_moves(board, player):
    temp_board = board.copy()

    temp_board.turn = player

    legal_moves = []
    for move in temp_board.legal_moves:
        if temp_board.piece_at(move.from_square) is not None and temp_board.piece_at(move.from_square).color == player:
            legal_moves.append(chess.Move.from_uci(move.uci()))

    return legal_moves


def make_move(board, move):
    temp_board = board.copy()
    temp_board.push(move)
    return temp_board


def alpha_beta_MinMaxL(position, depth, alpha, beta, maximizingPlayer):
    if depth == 0 or position.is_game_over():
        return evaluate_board(position)
    legal = list(position.legal_moves)
    if maximizingPlayer:
        maxEval = -float('inf')
        for move in legal:
            position.push(move)
            eval = alpha_beta_MinMaxL(position, depth - 1, alpha, beta, board.turn)
            position.pop()
            maxEval = max(maxEval, eval)
            alpha = max(alpha, eval)
            if beta <= alpha:
                break
        return maxEval

    else:
        minEval = float('inf')
        for move in legal:
            position.push(move)
            eval = alpha_beta_MinMaxL(position, depth - 1, alpha, beta, board.turn)
            position.pop()
            minEval = min(minEval, eval)
            beta = min(beta, eval)
            if beta <= alpha:
                break
        return minEval


def alpha_beta_MinMaxbest(position, depth, alpha, beta, k, maximizingPlayer):
    if depth == 0 or position.is_game_over():
        return evaluate_board(position)

    legal_moves = get_legal_moves(position, chess.WHITE if maximizingPlayer else chess.BLACK)
    move_scores = []  # is a list that contain tuples contain the move and the score ("a2a4",24)
    for move in legal_moves:
        temp_board = make_move(board, move)
        move_scores.append((move, evaluate_board(temp_board)))

    sorted_moves = sorted(move_scores, key=lambda x: x[1])  # then we sort that list back, based on the score as
    # requested in the file

    if maximizingPlayer:
        topkMoves = [move[0] for move in sorted_moves[-k:]]  # now we store the last k moves if maximaizePlayer is true
        # ,cuz the last k moves are the biggest
        maxEval = -float('inf')
        for move in topkMoves:  # then I looped througth topkMoves
            position.push(move)
            eval = alpha_beta_MinMaxbest(position, depth - 1, alpha, beta, k, board.turn)
            position.pop()
            maxEval = max(maxEval, eval)
            alpha = max(alpha, eval)
            if beta <= alpha:
                break
        return maxEval

    else:
        topkMoves = [move[0] for move in sorted_moves[:k]]  # here store the first k moves
        minEval = float('inf')
        for move in topkMoves:
            position.push(move)
            eval = alpha_beta_MinMaxbest(position, depth - 1, alpha, beta, k, board.turn)
            position.pop()
            minEval = min(minEval, eval)
            beta = min(beta, eval)
            if beta <= alpha:
                break
        return minEval


def computer_move():
    global board
    computer_color = not playerColor
    legal_moves = list(board.legal_moves)
    legal_moves = [item for item in legal_moves if not (len(item.uci()) == 5 and item.uci()[-1] == 'q')]
    if len(legal_moves) == 0:
        return

    best_move = None
    best_score_for_black = float('inf')
    best_score_for_white = -float('inf')
    for move in legal_moves:
        board.push(move)
        score = alpha_beta_MinMaxbest(board, 3, alpha, beta, 1, board.turn)
        board.pop()
        if computer_color == chess.WHITE:
            if score >= best_score_for_white:
                best_score_for_white = score
                best_move = move
        else:
            if score < best_score_for_black:
                best_score_for_black = score
                best_move = move

    return best_move


def reset_game_with_color(color):
    global board, playerColor, computerColor
    board.reset()
    if color == "w":
        playerColor = chess.WHITE
        computerColor = chess.BLACK
    else:
        playerColor = chess.BLACK
        computerColor = chess.WHITE


def undo_last_move():
    global board, last_move
    if len(board.move_stack) > 0:
        board.pop()
        last_move = board.pop()
    return last_move


app.debug = True
if __name__ == '__main__':
    app.run()
