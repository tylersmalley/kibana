"use strict";

var _arg = require("./arg");

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
describe('Arg', function () {
  it('sets required to false by default', function () {
    var isOptional = new _arg.Arg({
      name: 'optional_me'
    });
    expect(isOptional.required).toBe(false);
    var isRequired = new _arg.Arg({
      name: 'require_me',
      required: true
    });
    expect(isRequired.required).toBe(true);
  });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21tb24vbGliL2FyZy50ZXN0LmpzIl0sIm5hbWVzIjpbImRlc2NyaWJlIiwiaXQiLCJpc09wdGlvbmFsIiwiQXJnIiwibmFtZSIsImV4cGVjdCIsInJlcXVpcmVkIiwidG9CZSIsImlzUmVxdWlyZWQiXSwibWFwcGluZ3MiOiI7O0FBbUJBOztBQW5CQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBcUJBQSxRQUFRLENBQUMsS0FBRCxFQUFRLFlBQU07QUFDcEJDLEVBQUFBLEVBQUUsQ0FBQyxtQ0FBRCxFQUFzQyxZQUFNO0FBQzVDLFFBQU1DLFVBQVUsR0FBRyxJQUFJQyxRQUFKLENBQVE7QUFDekJDLE1BQUFBLElBQUksRUFBRTtBQURtQixLQUFSLENBQW5CO0FBR0FDLElBQUFBLE1BQU0sQ0FBQ0gsVUFBVSxDQUFDSSxRQUFaLENBQU4sQ0FBNEJDLElBQTVCLENBQWlDLEtBQWpDO0FBRUEsUUFBTUMsVUFBVSxHQUFHLElBQUlMLFFBQUosQ0FBUTtBQUN6QkMsTUFBQUEsSUFBSSxFQUFFLFlBRG1CO0FBRXpCRSxNQUFBQSxRQUFRLEVBQUU7QUFGZSxLQUFSLENBQW5CO0FBSUFELElBQUFBLE1BQU0sQ0FBQ0csVUFBVSxDQUFDRixRQUFaLENBQU4sQ0FBNEJDLElBQTVCLENBQWlDLElBQWpDO0FBQ0QsR0FYQyxDQUFGO0FBWUQsQ0FiTyxDQUFSIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIExpY2Vuc2VkIHRvIEVsYXN0aWNzZWFyY2ggQi5WLiB1bmRlciBvbmUgb3IgbW9yZSBjb250cmlidXRvclxuICogbGljZW5zZSBhZ3JlZW1lbnRzLiBTZWUgdGhlIE5PVElDRSBmaWxlIGRpc3RyaWJ1dGVkIHdpdGhcbiAqIHRoaXMgd29yayBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvbiByZWdhcmRpbmcgY29weXJpZ2h0XG4gKiBvd25lcnNoaXAuIEVsYXN0aWNzZWFyY2ggQi5WLiBsaWNlbnNlcyB0aGlzIGZpbGUgdG8geW91IHVuZGVyXG4gKiB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5XG4gKiBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLFxuICogc29mdHdhcmUgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW5cbiAqIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXG4gKiBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGVcbiAqIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnNcbiAqIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCB7IEFyZyB9IGZyb20gJy4vYXJnJztcblxuZGVzY3JpYmUoJ0FyZycsICgpID0+IHtcbiAgaXQoJ3NldHMgcmVxdWlyZWQgdG8gZmFsc2UgYnkgZGVmYXVsdCcsICgpID0+IHtcbiAgICBjb25zdCBpc09wdGlvbmFsID0gbmV3IEFyZyh7XG4gICAgICBuYW1lOiAnb3B0aW9uYWxfbWUnLFxuICAgIH0pO1xuICAgIGV4cGVjdChpc09wdGlvbmFsLnJlcXVpcmVkKS50b0JlKGZhbHNlKTtcblxuICAgIGNvbnN0IGlzUmVxdWlyZWQgPSBuZXcgQXJnKHtcbiAgICAgIG5hbWU6ICdyZXF1aXJlX21lJyxcbiAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgIH0pO1xuICAgIGV4cGVjdChpc1JlcXVpcmVkLnJlcXVpcmVkKS50b0JlKHRydWUpO1xuICB9KTtcbn0pO1xuIl19