#!/usr/bin/env node
import { vkTunnel } from './vkTunnel';

vkTunnel().catch((error) => console.log(error));
