/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

export * from './enzyme_helpers';

export * from './find_test_subject';

export * from './jsdom_svg_mocks';

export * from './random';

export * from './redux_helpers';

export * from './router_helpers';

export * from './stub_browser_storage';

export * from './stub_web_worker';

export * from './testbed';

export const nextTick = () => new Promise((res) => process.nextTick(res));

export const wait = (time = 0) => new Promise((resolve) => setTimeout(resolve, time));
