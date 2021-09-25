import { Component, OnInit } from '@angular/core';
import { Game } from 'src/models/game';
import { MatDialog } from '@angular/material/dialog';
import { DialogAddPlayerComponent } from '../dialog-add-player/dialog-add-player.component';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { EditPlayerComponent } from '../edit-player/edit-player.component';
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {

  game: Game;
  gameId: string
  gameOver = false;

  topMarginForPlayerNames = 1; // In REM
  marginBetweenNames = 5; // In REM




  constructor(
    private route: ActivatedRoute,
    private firestore: AngularFirestore,
    public dialog: MatDialog) { }

  ngOnInit(): void {
    this.newGame();
    this.route.params.subscribe((params) => {
      console.log(params.id);
      this.gameId = params.id;

      this
        .firestore
        .collection('games')
        .doc(this.gameId)
        .valueChanges()
        .subscribe((game: any) => {
          console.log('Game update', game);
          this.game.currentPlayer = game.currentPlayer;
          this.game.playedCards = game.playedCards;
          this.game.players = game.players;
          this.game.player_images = game.player_images;
          this.game.stack = game.stack;
          this.game.pickCardAnimation = game.pickCardAnimation;
          this.game.currentCard = game.currentCard;
        });
    });

  }

  /**
  * Set margins for player-display based on window-width & height
  */
  @HostListener('window:resize', ['$event'])
  arrangePlayerDisplay() {
    let width = window.innerWidth;
    let height = window.innerHeight;
    if (width < 450 || height < 600) (this.setSmallUi())
    else if (width < 1200) (this.setMediumUi())
    else (this.setLargeUi())

  }

  setSmallUi() {
    this.marginBetweenNames = 2.75;
    this.topMarginForPlayerNames = 0.5;
  }

  setMediumUi() {
    this.marginBetweenNames = 4.5;
    this.topMarginForPlayerNames = 1;
  }

  setLargeUi() {
    this.topMarginForPlayerNames = 3.5;
    this.marginBetweenNames = 6;
  }



  newGame() {
    this.game = new Game();
  }




  takeCard() {
    if (this.game.stack.length == 0) {
      this.gameOver = true;
    } else if (!this.game.pickCardAnimation) // if this.pickCardAnimation false (!)
      this.game.currentCard = this.game.stack.pop();
    this.game.pickCardAnimation = true;
    console.log('New card:' + this.game.currentCard) //current card on the board
    console.log('Game is', this.game);
    this.game.currentPlayer++;
    this.game.currentPlayer = this.game.currentPlayer % this.game.players.length;
    this.saveGame();

    setTimeout(() => {
      this.game.playedCards.push(this.game.currentCard);
      this.game.pickCardAnimation = false;
      this.saveGame();
    }, 1000);
  }

  editPlayer(playerId: number) {
    console.log('Edit player', playerId);
    const dialogRef = this.dialog.open(EditPlayerComponent);

    dialogRef.afterClosed().subscribe((change: string) => {
      console.log('Received change', change);
      if (change) {
        if (change == 'DELETE') {
          this.game.players.splice(playerId, 1);
          this.game.player_images.splice(playerId, 1);
        } else {
          this.game.player_images[playerId] = change;
        }
        this.saveGame();
      }
    });

  }

  /**
   * Open dialog to add player
   */

  openDialog(): void {
    const dialogRef = this.dialog.open(DialogAddPlayerComponent);

    dialogRef.afterClosed().subscribe((name: string) => {
      if (name && name.length > 0) {
        this.game.players.push(name);
        this.game.player_images.push('1.png');
        this.saveGame();
      }
    });
  }

  saveGame() {
    this.firestore
      .collection('games')
      .doc(this.gameId)
      .update(this.game.toJson());
  }






}

