;; Resource Registration Contract
;; Records available emergency supplies and equipment

(define-data-var last-resource-id uint u0)

;; Resource types
(define-constant RESOURCE_TYPE_WATER u1)
(define-constant RESOURCE_TYPE_FOOD u2)
(define-constant RESOURCE_TYPE_SHELTER u3)
(define-constant RESOURCE_TYPE_MEDICAL u4)
(define-constant RESOURCE_TYPE_EQUIPMENT u5)

;; Resource status
(define-constant STATUS_AVAILABLE u1)
(define-constant STATUS_RESERVED u2)
(define-constant STATUS_DEPLOYED u3)

;; Resource data structure
(define-map resources
  { resource-id: uint }
  {
    owner: principal,
    resource-type: uint,
    quantity: uint,
    location: (string-utf8 100),
    status: uint,
    last-updated: uint
  }
)

;; Register a new resource
(define-public (register-resource (resource-type uint) (quantity uint) (location (string-utf8 100)))
  (let
    (
      (new-id (+ (var-get last-resource-id) u1))
    )
    (asserts! (and (>= resource-type u1) (<= resource-type u5)) (err u1))
    (asserts! (> quantity u0) (err u2))

    (map-set resources
      { resource-id: new-id }
      {
        owner: tx-sender,
        resource-type: resource-type,
        quantity: quantity,
        location: location,
        status: STATUS_AVAILABLE,
        last-updated: block-height
      }
    )

    (var-set last-resource-id new-id)
    (ok new-id)
  )
)

;; Update resource quantity
(define-public (update-quantity (resource-id uint) (new-quantity uint))
  (let
    (
      (resource (unwrap! (map-get? resources { resource-id: resource-id }) (err u404)))
    )
    (asserts! (is-eq (get owner resource) tx-sender) (err u403))
    (asserts! (> new-quantity u0) (err u2))

    (map-set resources
      { resource-id: resource-id }
      (merge resource {
        quantity: new-quantity,
        last-updated: block-height
      })
    )
    (ok true)
  )
)

;; Update resource status
(define-public (update-status (resource-id uint) (new-status uint))
  (let
    (
      (resource (unwrap! (map-get? resources { resource-id: resource-id }) (err u404)))
    )
    (asserts! (is-eq (get owner resource) tx-sender) (err u403))
    (asserts! (and (>= new-status u1) (<= new-status u3)) (err u1))

    (map-set resources
      { resource-id: resource-id }
      (merge resource {
        status: new-status,
        last-updated: block-height
      })
    )
    (ok true)
  )
)

;; Get resource details
(define-read-only (get-resource (resource-id uint))
  (map-get? resources { resource-id: resource-id })
)

;; Get the total number of registered resources
(define-read-only (get-resource-count)
  (var-get last-resource-id)
)
