/*
 *     Copyright 2016 IBM Corp.
 *     Licensed under the Apache License, Version 2.0 (the "License");
 *     you may not use this file except in compliance with the License.
 *     You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 *     Unless required by applicable law or agreed to in writing, software
 *     distributed under the License is distributed on an "AS IS" BASIS,
 *     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *     See the License for the specific language governing permissions and
 *     limitations under the License.
 */
var Q = require('q');
var _ = require('lodash');

function ObjectStorageObject(name, objectStorageContainer) {
    this.name = name;
    this.baseResourceUrl = objectStorageContainer.baseResourceUrl + '/' + name;
    this.objectStorage = objectStorageContainer.objectStorage;
    this.client = this.objectStorage.client;
}

/**
 *  Load the content of this object.
 *
 *  @param {boolean} shouldCache.  A flag telling this object whether or not to cache the data internally.
 *  @return promise
 */
ObjectStorageObject.prototype.load = function(shouldCache) {
    var deferred = Q.defer();
    var resourceUrl = this.baseResourceUrl;
    var self = this;

    this.client.get(resourceUrl).then(function(response) {
        if (shouldCache) {
            self.data = response.body;
        }
        deferred.resolve(response.body);
    }).catch(function(err) {
        deferred.reject(err);
    });

    return deferred.promise;
};

/**
 *  Retrieve the metadata for this object.
 *
 */
ObjectStorageObject.prototype.metadata = function() {
    var deferred = Q.defer();
    var resourceUrl = this.baseResourceUrl;

    this.client.head(resourceUrl).then(function(response) {
        var headers = response.headers;
        var accountMetadata = _.pickBy(headers, function(value, key) {

            return _.startsWith(key, 'x-object');
        });
        deferred.resolve(accountMetadata);
    }).catch(function(err) {
        deferred.reject(err);
    });

    return deferred.promise;
};

/**
 *  Retrieve the metadata for this container.
 *
 * @return promise
 */
ObjectStorageObject.prototype.updateMetadata = function(metadata) {
    var deferred = Q.defer();
    var prefix = 'X-Object-Meta-';
    var resourceUrl = this.baseResourceUrl;
    var headers = {};

    _.forIn(metadata, function(value, key) {
        var metadataKey = prefix + key;
        headers[metadataKey] = value;
    });

    this.client.post(resourceUrl, headers).then(function(response) {
       deferred.resolve();
    }).catch(function(err) {
        deferred.reject(err);
    });

    return deferred.promise;
};

/**
 *  Create or Update the specified metadata for this object.
 *
 *  @param {object} metadata.  The metadata to update/create for this object.
 *  @return promise
 */
ObjectStorageObject.prototype.deleteMetadata = function(metadata) {
    var deferred = Q.defer();
    var prefix = 'X-Remove-Object-Meta-';
    var resourceUrl = this.baseResourceUrl;
    var headers = {};

    _.forIn(metadata, function(value, key) {
        var metadataKey = prefix + key;
        headers[metadataKey] = value;
    });

    this.client.post(resourceUrl, headers).then(function(response) {
        deferred.resolve();
    }).catch(function(err) {
        deferred.reject(err);
    });

    return deferred.promise;
};

/**
 *  Delete the specified metadata for this object.
 *
 *  @param {object} metadata.  The metadata to delete for this object.
 *  @return promise
 */
ObjectStorageObject.prototype.objectName = function() {

    return this.name;
};

module.exports = {
    ObjectStorageObject: ObjectStorageObject
};