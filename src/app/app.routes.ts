import { Routes } from '@angular/router';

export const routes: Routes = [

    {
        path:"",
        pathMatch:"full",
        loadComponent:()=>{
            return import("./components/home/home.component").then((e)=>e.HomeComponent)
        }
        
    },
    {
        path:"play",
        children: [
      {
        path: 'friends',
        loadComponent: () => import('./components/friends/friends.component').then(m => m.FriendsComponent),
      },
      {
        path: 'computer',
        loadComponent: () => import('./components/computer/computer.component').then(m => m.ComputerComponent),
      },
      {
        path:'*',
        redirectTo:'',
        pathMatch:"full"
      }
    ]
    }
  
    
];
