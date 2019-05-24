/****************************************************************************
**
** Copyright (C) 2015 The Qt Company Ltd.
** Contact: http://www.qt.io/licensing/
**
** This file is part of the examples of the Qt Toolkit.
**
** $QT_BEGIN_LICENSE:BSD$
** You may use this file under the terms of the BSD license as follows:
**
** "Redistribution and use in source and binary forms, with or without
** modification, are permitted provided that the following conditions are
** met:
**   * Redistributions of source code must retain the above copyright
**     notice, this list of conditions and the following disclaimer.
**   * Redistributions in binary form must reproduce the above copyright
**     notice, this list of conditions and the following disclaimer in
**     the documentation and/or other materials provided with the
**     distribution.
**   * Neither the name of The Qt Company Ltd nor the names of its
**     contributors may be used to endorse or promote products derived
**     from this software without specific prior written permission.
**
**
** THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
** "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
** LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
** A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
** OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
** SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
** LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
** DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
** THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
** (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
** OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE."
**
** $QT_END_LICENSE$
**
****************************************************************************/

//![0]
import QtQuick 2.0
import QtQuick.Particles 2.0
import "content/happyelements-xxl.js" as HappyElements
import "content"

Rectangle {
    id: screen

    width: 490; height: 720

    property int delayint: 1000

    SystemPalette { id: activePalette }

    Timer {
        id: timer1;
        repeat: false;
        onTriggered: {screen.floodLoop()}
    }
    Timer {
        id: timer2;
        repeat: false;
        onTriggered: {screen.shuffle()}
    }
    Timer {
        id: timer3;
        repeat: false;
        onTriggered: {screen.dfs()}
    }

    function delay1(delayTime) {
        timer1.interval = delayTime;
        timer1.start();
    }
    function delay2(delayTime) {
        timer2.interval = delayTime;
        timer2.start();
    }
    function delay3(delayTime) {
        timer3.interval = delayTime;
        timer3.start();
    }

    function shuffle() {
        HappyElements.shuffleDown();
        screen.delay1(delayint);
    }

    function floodLoop() {
        var res = HappyElements.floodCheck();
        if(res) {
            screen.delay2(delayint);
        } else if(gameCanvas.dfsing == true){
//            screen.delay3(delayint);
            dfs();
        }
    }

    function dfs() {

        if(HappyElements.currentRow < 0) {
            HappyElements.direction = 3;
            HappyElements.currentColumn = 0;
            HappyElements.currentRow = HappyElements.maxRow-1;
        }

        switch(HappyElements.direction) {
            case 1:
                HappyElements.storeBoard();
                if (HappyElements.swapRight()) {
                    HappyElements.currentColumn = 0;
                    HappyElements.currentRow = HappyElements.maxRow-1;
                    shuffle();
                } else {
                    HappyElements.restoreBoard();
                    HappyElements.direction++;
                    dfs();
                }
                break;
            case 2:
                HappyElements.storeBoard();
                if (HappyElements.swapTop()) {
                    HappyElements.currentColumn = 0;
                    HappyElements.currentRow = HappyElements.maxRow-1;
                    HappyElements.direction = 1;
                    shuffle();
                } else {
                    HappyElements.restoreBoard();
                    HappyElements.currentColumn++;
                    if(HappyElements.currentColumn == HappyElements.maxColumn){
                        HappyElements.currentColumn = 0;
                        HappyElements.currentRow--;
                    }
                    HappyElements.direction = 1;
                    dfs();
                }
                break;
            case 3:
                if(HappyElements.restoreBoard()){
                    HappyElements.direction++;
                    screen.delay3(delayint);
//                    dfs();
                } else {
                    gameCanvas.dfsing = false;
                }
        }
    }

    Item {
        width: parent.width
        anchors { top: parent.top; bottom: toolBar.top }

        Image {
            id: background
            anchors.fill: parent
            source: "content/pics/background.png"
            fillMode: Image.PreserveAspectCrop
        }

//![1]
        Item {
            id: gameCanvas

            property bool dfsing: false
            property int score: 0
            property int blockSize: 40
            property ParticleSystem ps: particleSystem

            width: parent.width - (parent.width % blockSize)
            height: parent.height - (parent.height % blockSize)
            anchors.centerIn: parent

            MouseArea {
                anchors.fill: parent
                onClicked: HappyElements.handleClick(mouse.x, mouse.y)
            }
        }
//![1]
    }

//![2]
    Dialog {
        id: dialog
        anchors.centerIn: parent
        z: 100
    }
//![2]

    Rectangle {
        id: toolBar
        width: parent.width; height: 30
        color: activePalette.window
        anchors.bottom: screen.bottom

        Item {
            anchors { left: parent.left; verticalCenter: parent.verticalCenter }
            width: 140
            Button {
                anchors { left: parent.left; verticalCenter: parent.verticalCenter }
                text: "New Game"
                onClicked: HappyElements.startNewGame()
            }

            Button {
                anchors { right: parent.right; verticalCenter: parent.verticalCenter }
                text: "Solution"
                onClicked: function(){
                    gameCanvas.dfsing = true;
                    HappyElements.currentColumn = -1;
                    HappyElements.currentRow = HappyElements.maxRow-1;
                    HappyElements.direction = 1;
                    dfs();
                }
            }
        }

        Text {
            id: score
            anchors { right: parent.right; verticalCenter: parent.verticalCenter }
            text: "Score: " + gameCanvas.score + "  "
        }
    }

    ParticleSystem{
            id: particleSystem;
            anchors.fill: parent
            z: 5
            ImageParticle {
                id: smokeParticle
                groups: ["smoke"]
                source: "content/pics/particle-smoke.png"
                alpha: 0.1
                alphaVariation: 0.1
                color: "yellow"
            }
            Loader {
                id: auxLoader
                anchors.fill: parent
                source: "content/PrimaryPack.qml"
                onItemChanged: {
                    if (item && "particleSystem" in item)
                        item.particleSystem = particleSystem
                    if (item && "gameArea" in item)
                        item.gameArea = gameCanvas
                }
            }
        }
}
//![0]
