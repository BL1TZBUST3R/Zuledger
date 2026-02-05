import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  
  const token = localStorage.getItem('token');
  
  // 👇 DEBUG LOG: This will tell us if the Interceptor is running!
  console.log('🕵️ INTERCEPTOR SPY: ', { 
    url: req.url, 
    hasToken: !!token, 
    tokenValue: token 
  });

  if (token) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedRequest);
  }

  return next(req);
};