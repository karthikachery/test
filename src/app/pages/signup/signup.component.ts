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

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {

  picture : string ="../../../assets/login_img.jpg";
  uploadPercent:number = null;

  constructor(
    private auth:AuthService,
    private router:Router,
    private toastr:ToastrService,
    private storage:AngularFireStorage,
    private db:AngularFireDatabase,
  ) { }

  ngOnInit(): void {
  }

  onSubmit(f:NgForm){

    const {email,password,username,country,bio, name} = f.form.value;

    this.auth.signUp(email,password)
    .then((res) =>{
    console.log(res);
    const {uid} = res.user;

    this.db.object(`/users/${uid}`)
    .set({
      id: uid,
      name: name,
      email:email,
      instaUserName: username,
      bio:bio,
      country:country,
      picture: this.picture
    })
    
  })
    .then(()=>{
      this.router.navigateByUrl('/');
      this.toastr.success("SignUp Success");
    })
    .catch((err) => {
      this.toastr.error("SignUp Failed");
      console.log(err);
    })
  }

  async uploadFile(event){

    const file =event.target.files[0];

    let resizedImage = await readAndCompressImage(file,imageConfig);

    const filePath =file.name;

    const fileRef= this.storage.ref(filePath);

    const task = this.storage.upload(filePath,resizedImage);

    task.percentageChanges().subscribe((percentage)=>{
      this.uploadPercent = percentage;
    });

    task.snapshotChanges()
    .pipe(
      finalize(()=>{
        fileRef.getDownloadURL().subscribe((url)=>{
          this.picture=url;
          this.toastr.success("Image Uploaded Successfully!!");
        })
      })
    )
    .subscribe()
  }
}
