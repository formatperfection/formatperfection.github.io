let socket;
let isHost = false;

// WebSocket logic for Wi-Fi multiplayer
function connectToServer() {
  socket = new WebSocket("ws://" + window.location.hostname + ":3000");

  socket.onopen = () => {
    console.log("Connected to server");
    // First to connect is the host
    if (socket.readyState === WebSocket.OPEN) {
      isHost = true;
    }
  };

  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === "opponentMove") {
      // Move remote paddle (Player 2)
      player2Y = msg.data.y;
    }
  };

  socket.onclose = () => {
    console.log("Disconnected from server");
  };
}
(() => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const startScreen = document.getElementById("startScreen");
  const difficultyScreen = document.getElementById("difficultyScreen");
  const roundScoreDisplay = document.getElementById("roundScoreDisplay");
  const restartBtn = document.getElementById("restartBtn");

  let paddleWidth = 15,
    paddleHeight = 100,
    ballRadius = 10;
  let playerY = canvas.height / 2 - paddleHeight / 2;
  let player2Y = playerY; // for 2p mode
  let aiY = playerY;
  let aiCurrentSpeed = 0;
  let ballX = canvas.width / 2,
    ballY = canvas.height / 2;
  let ballVX = 6,
    ballVY = 4;

  let playerScore = 0,
    aiScore = 0;
  let player2Score = 0; // for 2p mode

  let playerRounds = 0,
    aiRounds = 0;
  let round = 1;
  const maxRounds = 5;

  let timeLeft = 60;
  const roundDuration = 60;
  let timerInterval;

  let gameOver = false;
  let gameMode = null; // "1p" or "2p"
  let difficulty = "medium";

  // Difficulty settings for AI
  const difficultySettings = {
    easy: { speed: 2, reactOffset: 80, mistakeChance: 0.5 },
    medium: { speed: 4, reactOffset: 40, mistakeChance: 0.23 },
    hard: { speed: 7, reactOffset: 20, mistakeChance: 0.12 },
    extreme: {
      speed: 20,
      reactOffset: 0,
      mistakeChance: 0.01,
      perfectTracking: false,
    },
    impossible: {
      speed: 2000,
      reactOffset: 0,
      mistakeChance: 0.0,
      perfectTracking: true,
    },
  };

  let aiPauseTimer = 0;

  function resetPositions() {
    playerY = canvas.height / 2 - paddleHeight / 2;
    player2Y = playerY;
    aiY = playerY;
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;

    // Randomize ball start direction and velocity
    const angle = (Math.random() * 0.4 + 0.3) * (Math.random() > 0.5 ? 1 : -1);
    ballVX = (Math.random() > 0.5 ? 1 : -1) * 6;
    ballVY = ballVX * Math.tan(angle);
  }

  function startTimer() {
    clearInterval(timerInterval);
    timeLeft = roundDuration;
    timerInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        endRound();
      }
    }, 1000);
  }

  function endRound() {
    clearInterval(timerInterval);
    let isDraw = false;
    if (gameMode === "2p") {
      if (playerScore > player2Score) playerRounds++;
      else if (player2Score > playerScore)
        aiRounds++; // reuse aiRounds for player2 rounds
      else isDraw = true;
    } else if (gameMode === "AIAI") {
      if (playerScore > aiScore) playerRounds++;
      else if (aiScore > playerScore) aiRounds++;
      else isDraw = true;
    } else {
      if (playerScore > aiScore) playerRounds++;
      else if (aiScore > playerScore) aiRounds++;
      else isDraw = true;
    }

    if (isDraw && playerRounds < 3 && aiRounds < 3 && round >= maxRounds) {
      gameOver = true;
      showDrawScreen();
      if (typeof stopGame === "function") stopGame();
      return;
    }

    if (playerRounds >= 3 || aiRounds >= 3 || round >= maxRounds) {
      gameOver = true;
    } else {
      round++;
      playerScore = 0;
      aiScore = 0;
      player2Score = 0;
      resetPositions();
      startTimer();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw center net
    ctx.strokeStyle = "rgba(0, 229, 255, 0.25)";
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 16]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    ctx.fillStyle = "#00e5ff";
    ctx.fillRect(0, playerY, paddleWidth, paddleHeight);
    if (gameMode === "2p") {
      ctx.fillRect(
        canvas.width - paddleWidth,
        player2Y,
        paddleWidth,
        paddleHeight
      );
    } else {
      ctx.fillRect(canvas.width - paddleWidth, aiY, paddleWidth, paddleHeight);
    }

    // Draw ball
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#66ffff";
    ctx.shadowColor = "#00e5ff";
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw scores and info
    ctx.fillStyle = "#00e5ff";
    ctx.font = "24px monospace";
    ctx.fillText(
      `Score: ${playerScore} - ${gameMode === "2p" ? player2Score : aiScore}`,
      25,
      40
    );
    ctx.fillText(`Round: ${round} / ${maxRounds}`, 25, 75);
    ctx.fillText(`Time: ${timeLeft}s`, 25, 110);

    // Round scores at top center
    let roundsText;
    if (gameMode === "2p") {
      roundsText = `Player 1: ${playerRounds}   -   Player 2: ${aiRounds}`;
    } else if (gameMode === "AIAI") {
      roundsText = `AI 1: ${playerRounds}   -   AI 2: ${aiRounds}`;
    } else {
      roundsText = `Player: ${playerRounds}   -   AI: ${aiRounds}`;
    }
    roundScoreDisplay.textContent = roundsText;

    if (gameOver) {
      ctx.fillStyle = "#fffa00";
      ctx.font = "54px sans-serif";
      let winner = "";
      if (
        (gameMode === "2p" && playerRounds === aiRounds) ||
        (gameMode === "AIAI" && playerRounds === aiRounds) ||
        (gameMode !== "2p" && gameMode !== "AIAI" && playerRounds === aiRounds)
      ) {
        winner = "It's a Draw!";
      } else if (gameMode === "2p") {
        winner = playerRounds > aiRounds ? "Player 1 Wins!" : "Player 2 Wins!";
      } else if (gameMode === "AIAI") {
        winner = playerRounds > aiRounds ? "AI 1 Wins!" : "AI 2 Wins!";
      } else {
        winner = playerRounds > aiRounds ? "Player Wins!" : "AI Wins!";
      }
      ctx.fillText(
        winner,
        canvas.width / 2 - ctx.measureText(winner).width / 2,
        canvas.height / 2
      );
      restartBtn.style.display = "block";
    }
  }

  function updateAI() {
    const settings = difficultySettings[difficulty];

    if (difficulty === "impossible") {
      // AI paddle always tracks the ball perfectly
      aiY = ballY - paddleHeight / 2;
      aiY = Math.max(0, Math.min(canvas.height - paddleHeight, aiY));
      return;
    }

    if (difficulty === "extreme") {
      // ExtremeAI logic: Predict player action, counter, rare mistakes
      // Simulate player and AI state objects
      const player = {
        x: 0 + paddleWidth / 2,
        isAttacking: Math.abs(ballVX) > 10 && ballVX < 0, // player hits hard left
        isBlocking: Math.abs(ballVX) < 5 && ballVX < 0, // player slows ball left
      };
      const ai = {
        x: canvas.width - paddleWidth / 2,
        performAttack: () => {
          // Move paddle quickly towards ball to "attack"
          aiY += (ballY - aiY) * 0.7 + (Math.random() - 0.5) * 8;
        },
        performBlock: () => {
          // Move paddle to block predicted ball position
          aiY += (ballY - aiY) * 0.4 + (Math.random() - 0.5) * 4;
        },
        moveTowards: (targetX) => {
          // Move paddle smoothly towards ball
          aiY += (ballY - aiY) * 0.25 + (Math.random() - 0.5) * 2;
        },
      };
      const game = {
        attackRange: 80,
      };
      // Mistake chance
      const mistakeChance = 0.00001;
      if (Math.random() < mistakeChance) {
        // Random mistake: do nothing, attack, or block
        const actions = [() => {}, ai.performAttack, ai.performBlock];
        actions[Math.floor(Math.random() * actions.length)]();
        aiY = Math.max(0, Math.min(canvas.height - paddleHeight, aiY));
        return;
      }
      // Predict player action
      function isPlayerAttackingClose() {
        return (
          player.isAttacking && Math.abs(player.x - ai.x) < game.attackRange
        );
      }
      function isPlayerBlocking() {
        return player.isBlocking;
      }
      function predictPlayerAction() {
        if (isPlayerAttackingClose()) return "attack";
        if (isPlayerBlocking()) return "block";
        return "idle";
      }
      // Decide AI action
      const playerAction = predictPlayerAction();
      if (playerAction === "attack") {
        ai.performBlock();
      } else if (playerAction === "block") {
        ai.performAttack();
      } else {
        ai.moveTowards(player.x);
      }
      aiY = Math.max(0, Math.min(canvas.height - paddleHeight, aiY));
      return;
    }

    if (aiPauseTimer > 0) {
      aiPauseTimer--;
      return;
    } else if (Math.random() < 0.005) {
      aiPauseTimer = 20 + Math.floor(Math.random() * 30);
      return;
    }

    const paddleCenter = aiY + paddleHeight / 2;
    let predictedballY = ballY;

    const makesMistake = Math.random() < settings.mistakeChance;
    if (makesMistake) {
      const maxOffset = settings.reactOffset;
      predictedballY += Math.random() * 2 * maxOffset - maxOffset;
    }

    const distance = predictedballY - paddleCenter;
    const acceleration = 0.5;

    if (distance > 5) {
      aiCurrentSpeed = Math.min(aiCurrentSpeed + acceleration, settings.speed);
    } else if (distance < -5) {
      aiCurrentSpeed = Math.max(aiCurrentSpeed - acceleration, -settings.speed);
    } else {
      aiCurrentSpeed *= 0.7;
    }

    aiY += aiCurrentSpeed;
    aiY = Math.max(0, Math.min(canvas.height - paddleHeight, aiY));
  }

  function updateball() {
    const prevVX = ballVX;
    const prevVY = ballVY;
    ballX += ballVX;
    ballY += ballVY;

    let speedIncreased = false;
    // Bounce top/bottom
    if (ballY + ballRadius > canvas.height) {
      ballY = canvas.height - ballRadius;
      ballVY = -ballVY;
      speedIncreased = true;
    } else if (ballY - ballRadius < 0) {
      ballY = ballRadius;
      ballVY = -ballVY;
      speedIncreased = true;
    }

    // Check collisions with paddles
    // Left paddle (player 1)
    if (ballX - ballRadius < paddleWidth) {
      if (ballY > playerY && ballY < playerY + paddleHeight) {
        ballX = paddleWidth + ballRadius;
        ballVX = -ballVX;
        // Add a bit of velocity variation based on hit position
        const hitPos = (ballY - playerY) / paddleHeight - 0.5;
        ballVY += hitPos * 5;
        speedIncreased = true;
      } else {
        // AI or Player 2 scores
        if (gameMode === "2p") {
          player2Score++;
        } else {
          aiScore++;
        }
        resetPositions();
      }
    }

    // Right paddle (AI or player 2)
    if (ballX + ballRadius > canvas.width - paddleWidth) {
      const paddleTop = gameMode === "2p" ? player2Y : aiY;
      if (ballY > paddleTop && ballY < paddleTop + paddleHeight) {
        ballX = canvas.width - paddleWidth - ballRadius;
        ballVX = -ballVX;
        const hitPos = (ballY - paddleTop) / paddleHeight - 0.5;
        ballVY += hitPos * 5;
        speedIncreased = true;
      } else {
        // Player 1 scores
        playerScore++;
        resetPositions();
      }
    }

    // Increase speed if ball touched anything (no cap)
    if (speedIncreased) {
      const speedIncrease = 0.4;
      const speed = Math.hypot(ballVX, ballVY) + speedIncrease;
      const angle = Math.atan2(ballVY, ballVX);
      ballVX = Math.cos(angle) * speed;
      ballVY = Math.sin(angle) * speed;
    }
  }

  // Player 1 controls: W/S (for 2p mode)
  const keysPressed = {};
  window.addEventListener("keydown", (e) => {
    keysPressed[e.key.toLowerCase()] = true;
  });
  window.addEventListener("keyup", (e) => {
    keysPressed[e.key.toLowerCase()] = false;
  });

  // Player 2 controls: Arrow Up/Down (for 2p)
  const keysPressed2 = {};
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      keysPressed2[e.key] = true;
    }
  });
  window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      keysPressed2[e.key] = false;
    }
  });

  function updatePlayers() {
    if (gameMode === "2p") {
      // Player 1 (W/S for 2p mode)
      if (keysPressed["w"]) playerY -= 13;
      if (keysPressed["s"]) playerY += 13;
      playerY = Math.max(0, Math.min(canvas.height - paddleHeight, playerY));
      // Player 2 (Arrow Up/Down)
      if (keysPressed2["ArrowUp"]) player2Y -= 13;
      if (keysPressed2["ArrowDown"]) player2Y += 13;
      player2Y = Math.max(0, Math.min(canvas.height - paddleHeight, player2Y));
    } else if (gameMode === "AIAI") {
      // Both paddles use AI logic
      updateAIPlayer1(); // left paddle
      updateAIPlayer2(); // right paddle
    } else if (gameMode === "wifi") {
      if (keysPressed["arrowUp"]) playerY -= 13;
      if (keysPressed["arrowDown"]) playerY += 13;
      playerY = Math.max(0, Math.min(canvas.height - paddleHeight, playerY));

      // Send paddle position to opponent
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({ type: "playerMove", data: { y: playerY } })
        );
      }
    } else {
      // 1p mode: Arrow keys for player
      if (keysPressed["arrowup"]) playerY -= 13;
      if (keysPressed["arrowdown"]) playerY += 13;
      playerY = Math.max(0, Math.min(canvas.height - paddleHeight, playerY));
    }
  }

  // AI logic for left paddle (AI1)
  function updateAIPlayer1() {
    // Use same logic as updateAI, but for playerY and same difficulty
    const settings = difficultySettings[difficulty];
    if (difficulty === "impossible") {
      playerY = ballY - paddleHeight / 2;
      playerY = Math.max(0, Math.min(canvas.height - paddleHeight, playerY));
      return;
    }
    if (difficulty === "extreme") {
      // Use same logic as right paddle, but mirrored for left
      const player = {
        x: canvas.width - paddleWidth / 2,
        isAttacking: Math.abs(ballVX) > 10 && ballVX > 0,
        isBlocking: Math.abs(ballVX) < 5 && ballVX > 0,
      };
      const ai = {
        x: 0 + paddleWidth / 2,
        performAttack: () => {
          playerY += (ballY - playerY) * 0.7 + (Math.random() - 0.5) * 8;
        },
        performBlock: () => {
          playerY += (ballY - playerY) * 0.4 + (Math.random() - 0.5) * 4;
        },
        moveTowards: (targetX) => {
          playerY += (ballY - playerY) * 0.25 + (Math.random() - 0.5) * 2;
        },
      };
      const game = { attackRange: 80 };
      const mistakeChance = 0.00001;
      if (Math.random() < mistakeChance) {
        const actions = [() => {}, ai.performAttack, ai.performBlock];
        actions[Math.floor(Math.random() * actions.length)]();
        playerY = Math.max(0, Math.min(canvas.height - paddleHeight, playerY));
        return;
      }
      function isPlayerAttackingClose() {
        return (
          player.isAttacking && Math.abs(player.x - ai.x) < game.attackRange
        );
      }
      function isPlayerBlocking() {
        return player.isBlocking;
      }
      function predictPlayerAction() {
        if (isPlayerAttackingClose()) return "attack";
        if (isPlayerBlocking()) return "block";
        return "idle";
      }
      const playerAction = predictPlayerAction();
      if (playerAction === "attack") {
        ai.performBlock();
      } else if (playerAction === "block") {
        ai.performAttack();
      } else {
        ai.moveTowards(player.x);
      }
      playerY = Math.max(0, Math.min(canvas.height - paddleHeight, playerY));
      return;
    }
    // ...other AI logic for easy/medium/hard...
    // Use same as updateAI but for playerY
    const paddleCenter = playerY + paddleHeight / 2;
    let predictedballY = ballY;
    const makesMistake = Math.random() < settings.mistakeChance;
    if (makesMistake) {
      const maxOffset = settings.reactOffset;
      predictedballY += Math.random() * 2 * maxOffset - maxOffset;
    }
    const distance = predictedballY - paddleCenter;
    const acceleration = 0.5;
    if (distance > 5) {
      aiCurrentSpeed = Math.min(aiCurrentSpeed + acceleration, settings.speed);
    } else if (distance < -5) {
      aiCurrentSpeed = Math.max(aiCurrentSpeed - acceleration, -settings.speed);
    } else {
      aiCurrentSpeed *= 0.7;
    }
    playerY += aiCurrentSpeed;
    playerY = Math.max(0, Math.min(canvas.height - paddleHeight, playerY));
  }
  // AI logic for right paddle (AI2)
  function updateAIPlayer2() {
    // Use same logic as updateAI for aiY and same difficulty
    updateAI(); // already uses aiY and difficulty
  }

  function gameLoop() {
    if (window.paused) {
      draw();
      return;
    }
    if (!gameOver) {
      if (gameMode === "1p") updateAI();
      updatePlayers();
      updateball();
      draw();
      requestAnimationFrame(gameLoop);
    } else {
      draw();
    }
  }

  // Setup UI buttons

  document.getElementById("btn1p").onclick = () => {
    gameMode = "1p";
    startScreen.style.display = "none";
    difficultyScreen.style.display = "block";
  };

  document.getElementById("btn2p").onclick = () => {
    gameMode = "2p";
    startScreen.style.display = "none";
    document.getElementById("modeTypeScreen").style.display = "block";
  };
  document.getElementById("btnLocal").onclick = () => {
    document.getElementById("modeTypeScreen").style.display = "none";
    canvas.style.display = "block";
    roundScoreDisplay.style.display = "block";
    restartBtn.style.display = "none";
    resetPositions();
    playerScore = 0;
    player2Score = 0;
    playerRounds = 0;
    aiRounds = 0;
    round = 1;
    gameOver = false;
    window.paused = false;
    if (document.getElementById("pause-btn"))
      document.getElementById("pause-btn").textContent = "Pause";
    startTimer();
    gameLoop();
  };

  document.getElementById("btnWiFi").onclick = () => {
    gameMode = "wifi";
    document.getElementById("modeTypeScreen").style.display = "none";
    canvas.style.display = "block";
    roundScoreDisplay.style.display = "block";
    restartBtn.style.display = "none";
    connectToServer(); // 🧠 connect to WebSocket server
    resetPositions();
    playerScore = 0;
    player2Score = 0;
    playerRounds = 0;
    aiRounds = 0;
    round = 1;
    gameOver = false;
    window.paused = false;
    if (document.getElementById("pause-btn"))
      document.getElementById("pause-btn").textContent = "Pause";
    startTimer();
    gameLoop();
  };

  // Add AI vs AI button logic
  document.getElementById("btnAIAI").onclick = () => {
    gameMode = "AIAI";
    startScreen.style.display = "none";
    difficultyScreen.style.display = "block";
  };

  // Difficulty selection logic
  difficultyScreen.querySelectorAll("button").forEach((btn) => {
    btn.onclick = () => {
      difficulty = btn.getAttribute("data-difficulty");
      difficultyScreen.style.display = "none";
      canvas.style.display = "block";
      roundScoreDisplay.style.display = "block";
      restartBtn.style.display = "none";
      resetPositions();
      playerScore = 0;
      aiScore = 0;
      player2Score = 0;
      playerRounds = 0;
      aiRounds = 0;
      round = 1;
      gameOver = false;
      window.paused = false;
      if (document.getElementById("pause-btn"))
        document.getElementById("pause-btn").textContent = "Pause";
      startTimer();
      gameLoop();
    };
  });

  restartBtn.onclick = () => {
    restartBtn.style.display = "none";
    roundScoreDisplay.style.display = "block";
    resetPositions();
    playerScore = 0;
    aiScore = 0;
    player2Score = 0;
    playerRounds = 0;
    aiRounds = 0;
    round = 1;
    gameOver = false;
    window.paused = false;
    if (document.getElementById("pause-btn"))
      document.getElementById("pause-btn").textContent = "Pause";
    startTimer();
    gameLoop();
    // --- PAUSE/RESUME BUTTON LOGIC ---
    window.paused = false;
    const pauseBtn = document.getElementById("pause-btn");
    if (pauseBtn) {
      pauseBtn.addEventListener("click", () => {
        window.paused = !window.paused;
        pauseBtn.textContent = window.paused ? "Resume" : "Pause";
        if (!window.paused) {
          // Resume game loop if not over
          if (typeof gameOver !== "undefined" && !gameOver)
            requestAnimationFrame(gameLoop);
        }
      });
    }
  };
})();
(() => {
  let trail = [];

  const maxTrail = 10;
  const maxBallSpeed = 20;

  // Override draw to include trail
  const originalDraw = draw;
  draw = function () {
    // Store trail
    trail.push({ x: ballX, y: ballY });
    if (trail.length > maxTrail) trail.shift();

    // Trail effect
    for (let i = 0; i < trail.length; i++) {
      const t = trail[i];
      ctx.beginPath();
      ctx.arc(t.x, t.y, ballR, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 229, 255, ${((i + 1) / maxTrail) * 0.3})`;
      ctx.fill();
    }

    originalDraw();
  };

  // Override ball update to limit speed & color
  const originalUpdateBall = updateBall;
  updateBall = function () {
    if (Math.abs(ballVX) > maxBallSpeed)
      ballVX = Math.sign(ballVX) * maxBallSpeed;
    if (Math.abs(ballVY) > maxBallSpeed)
      ballVY = Math.sign(ballVY) * maxBallSpeed;

    // Add random ball color effect on paddle hit
    if (
      (ballX - ballR < paddleW && ballY > p1Y && ballY < p1Y + paddleH) ||
      (ballX + ballR > 800 - paddleW &&
        ballY > (gameMode === "2p" ? p2Y : aiY) &&
        ballY < (gameMode === "2p" ? p2Y : aiY) + paddleH)
    ) {
      ballColor = `hsl(${Math.random() * 360}, 100%, 70%)`;
    }

    originalUpdateBall();
  };

  // Override updateAI to use prediction
  const originalUpdateAI = updateAI;
  updateAI = function () {
    const ai = aiSettings[difficulty];
    let predictedY = ballY + ballVY * ((800 - paddleW - ballX) / ballVX);
    predictedY = Math.max(0, Math.min(500 - paddleH, predictedY - ai.offset));

    if (Math.random() > ai.mistake) {
      if (aiY + paddleH / 2 < predictedY) aiY += ai.speed;
      else if (aiY + paddleH / 2 > predictedY) aiY -= ai.speed;
    }
    aiY = Math.max(0, Math.min(500 - paddleH, aiY));
  };

  // Add paddle motion smoothing (optional)
  let p1TargetY = p1Y,
    p2TargetY = p2Y;
  document.addEventListener("keydown", (e) => {
    if (e.key === "w") p1TargetY -= 50;
    if (e.key === "s") p1TargetY += 50;
    if (e.key === "arrowup") p2TargetY -= 50;
    if (e.key === "arrowdown") p2TargetY += 50;
  });

  const originalGameLoop = gameLoop;
  gameLoop = function loop() {
    // Smooth movement
    p1Y += (p1TargetY - p1Y) * 0.3;
    p2Y += (p2TargetY - p2Y) * 0.3;
    p1Y = Math.max(0, Math.min(500 - paddleH, p1Y));
    p2Y = Math.max(0, Math.min(500 - paddleH, p2Y));

    if (gameMode === "1p") updateAI();
    updateBall();
    draw();
    requestAnimationFrame(loop);
  };
})();
(() => {
  const speedIncreaseFactor = 1.07; // ⬅️ Increase by 7% per paddle hit
  const maxSpeed = 25; // ⬅️ Cap the speed to prevent it getting insane

  // Override updateBall to add speed increase logic
  const originalUpdateBall = updateBall;
  updateBall = function () {
    const hitLeft =
      ballX - ballR < paddleW && ballY > p1Y && ballY < p1Y + paddleH;
    const hitRight =
      ballX + ballR > 800 - paddleW &&
      ballY > (gameMode === "2p" ? p2Y : aiY) &&
      ballY < (gameMode === "2p" ? p2Y : aiY) + paddleH;

    if (hitLeft || hitRight) {
      // Increase speed with each paddle hit
      const angle = Math.atan2(ballVY, ballVX);
      let newSpeed = Math.min(
        Math.hypot(ballVX, ballVY) * speedIncreaseFactor,
        maxSpeed
      );
      ballVX = Math.cos(angle) * newSpeed;
      ballVY = Math.sin(angle) * newSpeed;
    }

    originalUpdateBall();
  };
})();
(() => {
  const speedIncrease = 0.4; // Increase per hit
  maxSpeed = 25;

  const origBallUpdate = updateBall;
  updateBall = function () {
    const prevVX = ballVX;
    const prevVY = ballVY;

    origBallUpdate(); // Call your original updateBall()

    // Detect if paddle hit occurred by VX direction flip
    const vxFlipped = (prevVX > 0 && ballVX < 0) || (prevVX < 0 && ballVX > 0);
    if (vxFlipped) {
      // Increase speed while keeping direction
      const speed = Math.min(
        Math.hypot(ballVX, ballVY) + speedIncrease,
        maxSpeed
      );
      const angle = Math.atan2(ballVY, ballVX);
      ballVX = Math.cos(angle) * speed;
      ballVY = Math.sin(angle) * speed;
    }
  };
})();
(() => {
  const speedIncrease = 0.3; // Increase per hit
  maxSpeed = 25;

  const origBallUpdate = updateBall;
  updateBall = function () {
    const prevVX = ballVX;
    const prevVY = ballVY;

    origBallUpdate(); // Run your original ball update logic

    // Detect any direction flip (collision)
    const vxFlipped = (prevVX > 0 && ballVX < 0) || (prevVX < 0 && ballVX > 0);
    const vyFlipped = (prevVY > 0 && ballVY < 0) || (prevVY < 0 && ballVY > 0);

    if (vxFlipped || vyFlipped) {
      // Increase total speed but keep current direction
      const speed = Math.min(
        Math.hypot(ballVX, ballVY) + speedIncrease,
        maxSpeed
      );
      const angle = Math.atan2(ballVY, ballVX);
      ballVX = Math.cos(angle) * speed;
      ballVY = Math.sin(angle) * speed;
    }
  };
})();
function checkForDrawOnTimeEnd(winnerDeclared) {
  if (!winnerDeclared) {
    showDrawScreen();
    stopGame(); // Make sure this stops the game loop
  }
}

function showDrawScreen() {
  const drawText = document.createElement("div");
  drawText.innerText = "It's a Draw";
  drawText.style.position = "absolute";
  drawText.style.top = "50%";
  drawText.style.left = "50%";
  drawText.style.transform = "translate(-50%, -50%)";
  drawText.style.fontSize = "3rem";
  drawText.style.color = "var(--primary-color)";
  drawText.style.textShadow = "0 0 12px var(--primary-color-light)";
  drawText.style.zIndex = "100";
  document.body.appendChild(drawText);

  // Optional: Show restart button
  const restartBtn = document.getElementById("restartBtn");
  if (restartBtn) restartBtn.style.display = "block";
}

function checkForDrawOnTimeEnd(winnerDeclared) {
  if (!winnerDeclared) {
    showDrawScreen();
    stopGame(); // This should pause or stop your game loop or timer
  }
}

function showDrawScreen() {
  const drawText = document.createElement("div");
  drawText.innerText = "Draw!";
  drawText.style.position = "absolute";
  drawText.style.top = "50%";
  drawText.style.left = "50%";
  drawText.style.transform = "translate(-50%, -50%)";
  drawText.style.fontSize = "3rem";
  drawText.style.color = "var(--primary-color)";
  drawText.style.textShadow = "0 0 12px var(--primary-color-light)";
  drawText.style.zIndex = "100";
  document.body.appendChild(drawText);

  // Optional: Show restart button
  document.getElementById("restartBtn").style.display = "block";
}
const teacher = document.getElementById("BF");
const iframeBtn = document.getElementById("iframeBtn");
const iframe = document.querySelector("iframe");
const esc = document.getElementById("esc");
const bf = document.getElementById("BF");

function toggleIframe() {
  iframeBtn.addEventListener("click", function () {
    iframe.src = "Lang-generator/index.html";
    iframe.style.display = "block";
    esc.style.display = "block";

    // Hide the #esc div after 1 second
    setTimeout(() => {
      esc.style.display = "none";
    }, 1000);
  });

  // Optional: Add ESC key listener to hide iframe (fixed version)
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      iframe.style.display = "none";
    }
  });
}

toggleIframe();
document.getElementById("downloadBtn").addEventListener("click", function () {
  const link = document.createElement("a");
  link.href = "paddle.zip";
  link.download = "paddle.zip";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});
