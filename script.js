document.addEventListener('DOMContentLoaded', function() {
    // ======== 1. 添加新零件 ========
    document.getElementById('addPartBtn').addEventListener('click', function() {
        const container = document.getElementById('partsContainer');
        const newRow = document.createElement('div');
        newRow.className = 'part-row';
        newRow.innerHTML = `
            <label>宽度: <input type="number" class="partWidth" value="300" min="10"></label>
            <label>高度: <input type="number" class="partHeight" value="200" min="10"></label>
            <label>数量: <input type="number" class="partQuantity" value="5" min="1"></label>
        `;
        container.appendChild(newRow);
    });

    // ======== 2. 核心排版函数（支持多板）========
    document.getElementById('calculateBtn').addEventListener('click', function() {
        // 读取板材尺寸
        const boardWidth = parseInt(document.getElementById('boardWidth').value);
        const boardHeight = parseInt(document.getElementById('boardHeight').value);
        
        // 获取所有零件（展开数量）
        const parts = [];
        document.querySelectorAll('.part-row').forEach(row => {
            const width = parseInt(row.querySelector('.partWidth').value);
            const height = parseInt(row.querySelector('.partHeight').value);
            const quantity = parseInt(row.querySelector('.partQuantity').value);
            
            for (let i = 0; i < quantity; i++) {
                parts.push({ width, height });
            }
        });

        // === 关键修改：分板排版算法 ===
        const boards = []; // 存储所有板材
        let currentBoard = { id: 1, parts: [], usedArea: 0 }; // 当前正在排的板
        
        parts.forEach(part => {
            // 尝试放置到当前板
            if (canPlaceOnBoard(part, currentBoard, boardWidth, boardHeight)) {
                placePart(part, currentBoard, boardWidth);
            } else {
                // 放不下 → 保存当前板，新建下一块板
                boards.push(currentBoard);
                currentBoard = { 
                    id: boards.length + 2, 
                    parts: [], 
                    usedArea: 0 
                };
                placePart(part, currentBoard, boardWidth); // 放到新板
            }
        });
        
        // 保存最后一块板
        if (currentBoard.parts.length > 0) {
            boards.push(currentBoard);
        }

        // ======== 3. 绘制所有板的结果 ========
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const scale = 0.25; // 缩放比例
        const boardSpacing = 20; // 板间间距
        const maxBoardsPerRow = 2; // 每行最多2块板
        let currentCol = 0, currentRow = 0;

        let totalUsedArea = 0;
        const boardArea = boardWidth * boardHeight;

        boards.forEach(board => {
            // 计算这块板的位置
            const startX = 10 + (canvas.width / maxBoardsPerRow + boardSpacing) * currentCol;
            const startY = 10 + (boardHeight * scale + 60 + boardSpacing) * currentRow;

            // 绘制板材边框
            ctx.strokeStyle = '#2c6e3c';
            ctx.lineWidth = 2;
            ctx.strokeRect(startX, startY, boardWidth * scale, boardHeight * scale);
            ctx.fillStyle = '#000';
            ctx.font = '14px Arial';
            ctx.fillText(`板材 ${board.id}`, startX + 5, startY - 5);

            // 绘制每个零件
            let partIndex = 1;
            board.parts.forEach(p => {
                const x = startX + p.x * scale;
                const y = startY + p.y * scale;
                const w = p.width * scale;
                const h = p.height * scale;
                
                ctx.fillStyle = getRandomColor();
                ctx.fillRect(x, y, w, h);
                
                ctx.fillStyle = 'white';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(partIndex++, x + w/2, y + h/2);
            });

            // 计算并显示利用率
            const utilization = (board.usedArea / boardArea * 100).toFixed(1);
            ctx.fillStyle = '#2c6e3c';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`利用率: ${utilization}%`, startX, startY + boardHeight * scale + 15);

            totalUsedArea += board.usedArea;

            // 更新行列
            currentCol++;
            if (currentCol >= maxBoardsPerRow) {
                currentCol = 0;
                currentRow++;
            }
        });

        // ======== 4. 显示总结果 ========
        const totalUtilization = (totalUsedArea / (boards.length * boardArea) * 100).toFixed(1);
        document.getElementById('resultText').innerHTML = `
            🎯 排版完成！共使用 <strong>${boards.length}张板</strong> |
            总利用率: <strong>${totalUtilization}%</strong> |
            剩余空间: ${(100 - totalUtilization).toFixed(1)}%
        `;
    });

    // ======== 5. 辅助函数 ========
    // 判断零件能否放在当前板上
    function canPlaceOnBoard(part, board, boardWidth, boardHeight) {
        // 简单行式排列检查（不考虑复杂空隙）
        let currentY = 0;
        let currentX = 0;
        let currentRowMaxHeight = 0;

        // 模拟现有零件的布局
        board.parts.forEach(p => {
            if (currentX + p.width > boardWidth) {
                currentY += currentRowMaxHeight;
                currentX = 0;
                currentRowMaxHeight = 0;
            }
            // 更新行状态
            currentRowMaxHeight = Math.max(currentRowMaxHeight, p.height);
            currentX += p.width;
        });

        // 检查新零件是否能放入
        if (currentX + part.width <= boardWidth) {
            return (currentY + Math.max(currentRowMaxHeight, part.height)) <= boardHeight;
        } else {
            return (currentY + currentRowMaxHeight + part.height) <= boardHeight;
        }
    }

    // 在板上放置零件
    function placePart(part, board, boardWidth) {
        // 获取当前行状态
        let currentY = 0;
        let currentX = 0;
        let currentRowMaxHeight = 0;

        board.parts.forEach(p => {
            if (currentX + p.width > boardWidth) {
                currentY += currentRowMaxHeight;
                currentX = 0;
                currentRowMaxHeight = 0;
            }
            currentRowMaxHeight = Math.max(currentRowMaxHeight, p.height);
            currentX += p.width;
        });

        // 放置新零件
        if (currentX + part.width <= boardWidth) {
            part.x = currentX;
            part.y = currentY;
        } else {
            part.x = 0;
            part.y = currentY + currentRowMaxHeight;
        }

        // 添加到板
        board.parts.push(part);
        board.usedArea += part.width * part.height;
    }

    // 随机颜色
    function getRandomColor() {
        const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // 导出图片
    document.getElementById('exportBtn').addEventListener('click', function() {
        const link = document.createElement('a');
        link.href = document.getElementById('canvas').toDataURL('image/png');
        link.download = '家具排版结果.png';
        link.click();
    });

    // 重置
    document.getElementById('resetBtn').addEventListener('click', function() {
        location.reload();
    });
});
