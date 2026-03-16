import { InjectionToken } from '@angular/core';
import { SpringAuthConfig } from './auth.models';

export const SPRING_AUTH_CONFIG = new InjectionToken<SpringAuthConfig>(
  'SPRING_AUTH_CONFIG'
);
