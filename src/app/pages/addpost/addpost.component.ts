import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/services/auth.service';
//rxjs
import {finalize, takeLast} from 'rxjs/operators';
//firebase
import {AngularFireStorage} from '@angular/fire/storage';
import {AngularFireDatabase} from '@angular/fire/database';
//image resizer
import { readAndCompressImage } from 'browser-image-resizer';
import { imageConfig } from 'src/utils/config';

//uuid
import {v4 as uuid4} from 'uuid';

@Component({
  selector: 'app-addpost',
  templateUrl: './addpost.component.html',
  styleUrls: ['./addpost.component.css']
})
export class AddpostComponent implements OnInit {
  locationName:string =null;
  description:string;
  picture:string =null;

  uploadPercent:number =null;
  user = null;
  constructor(
    private auth: AuthService,
    private db: AngularFireDatabase,
    private storage:AngularFireStorage,
    private toastr: ToastrService,
    private router: Router,
  ) { 
    auth.getUser().subscribe((user)=>{
      this.db.object(`/user/${user.uid}`)
      .valueChanges()
      .subscribe((user)=>{
        this.user = user;
      });
    })
  }

  ngOnInit(): void {
  }

  onSubmit(){

    const uid =uuid4;

    this.db.object(`/posts/${uid}`)
    .set({
      id: uid,
      location: this.locationName,
      description :this.description,
      picture :this.picture,
      by : this.user.name,
      instaId : this.user.instaUserName,
      date : Date.now(),
    })
    .then(()=>{
      this.toastr.success('Story Uploaded successfully.');
      this.router.navigateByUrl('/');
    })
    .catch((err)=>{
      console.log(err);
      this.toastr.error('Error Occured!!');
    });
  }

  async uploadFile(event){

    const file = event.target.files[0];

    let resizedImage = await readAndCompressImage(file,imageConfig);

    const filePath = file.name;
    const fileRef = this.storage.ref(filePath);

    const task = this.storage.upload(filePath,resizedImage);

    task.percentageChanges().subscribe((percentage)=>{
      this.uploadPercent=percentage;
    });

    task.snapshotChanges().pipe(
      finalize(() => {
        fileRef.getDownloadURL().subscribe((url) => {
          this.picture = url;
          this.toastr.success("Image upload Success");
        });
      })
    ).subscribe();
  
  }
}
